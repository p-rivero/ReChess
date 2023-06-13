<template>
  <ChessgroundAdapter
    ref="board"
    :key="boardUpdatekey"
    :width="boardSize"
    :height="boardSize"
    :white-pov="true"
    :view-only="true"
    :initial-config="boardConfig"
    :piece-images="{white: [['P', image]], black: []}"
    :capture-wheel-events="false"
    :get-click-mode="getClickModeProxy"
    :cursor-pointer="cursorPointer"
    @clicked="clicked"
  />
</template>


<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { keyToPosition, positionToKey } from '@/helpers/chess/chess-coords'
  import ChessgroundAdapter from './internal/ChessgroundAdapter.vue'
  import arrowShape from '@/helpers/chess/slide-arrow-shape'
  import type { Config } from 'chessgroundx/config'
  import type { DrawShape } from 'chessgroundx/draw'
  import type { FullPieceDef } from '@/protochess/types'
  import type { Key } from 'chessgroundx/types'
  
  const props = defineProps<{
    piece: FullPieceDef
    boardSize: number
    position: [number, number]
    cursorPointer?: boolean
    getClickMode?: (position: [number, number]) => 'add'|'remove'
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', delta: [number, number], mode?: 'add'|'remove'): void
  }>()
  
  const image = computed(() => props.piece.imageUrls[0] || props.piece.imageUrls[1] || '')
  const board = ref<InstanceType<typeof ChessgroundAdapter>>()
  const boardUpdatekey = ref('')
    
  const getClickModeProxy = computed(() => {
    const fn = props.getClickMode
    if (!fn) return undefined
    return (key: Key) => {
      const coords = keyToPosition(key)
      const delta: [number, number] = [coords[0] - props.position[0], coords[1] - props.position[1]]
      return fn(delta)
    }
  })
    
  watch(props, () => {
    boardUpdatekey.value = `${props.boardSize}-${props.position}`
    nextTick(() => board.value?.setShapes(getShapes(props.position, props.boardSize)))
  })
  onMounted(() => board.value?.setShapes(getShapes(props.position, props.boardSize)))
    
  const boardConfig = computed<Config>(() => ({
    mapping: {
      whitePieces: ['P'],
      blackPieces: [],
    },
    fen: getFen(props.position),
    viewOnly: true,
    disableContextMenu: true,
    blockTouchScroll: true,
    coordinates: false,
    dimensions: {
      width: props.boardSize,
      height: props.boardSize,
    },
    drawable: {
      brushes: {
        purple: {
          key: 'purple',
          color: 'purple',
          opacity: 0.7,
          lineWidth: 15,
        },
        green: {
          key: 'green',
          color: 'green',
          opacity: 0.7,
          lineWidth: 15,
        },
        red: {
          key: 'red',
          color: 'red',
          opacity: 0.7,
          lineWidth: 15,
        },
      },
    },
    allyPieceSize: 1,
  }))
  
  
  function clicked(key: Key, mode?: 'add'|'remove') {
    const coords = keyToPosition(key)
    const delta: [number, number] = [coords[0] - props.position[0], coords[1] - props.position[1]]
    emit('clicked', delta, mode)
  }
  
  
  function getFen(position: [number, number]): string {
    let fen = ''
    fen += position[0]
    fen += 'P'
    fen += '/'.repeat(position[1])
    return fen
  }
  
  function getShapes(position: [number, number], boardSize: number): DrawShape[] {
    // Jump deltas
    
    let keysMove: Key[] = []
    for (const [x, y] of props.piece.translateJumpDeltas) {
      keysMove.push(positionToKey([x + position[0], y + position[1]]))
    }
    let keysCapture: Key[] = []
    for (const [x, y] of props.piece.attackJumpDeltas) {
      keysCapture.push(positionToKey([x + position[0], y + position[1]]))
    }
    // Intersection of keysMove and keysCapture
    let keysBoth: Key[] = []
    for (const key of keysMove) {
      if (keysCapture.includes(key)) {
        keysBoth.push(key)
      }
    }
    // Slso remove the keys from keysMove and keysCapture
    for (const key of keysBoth) {
      keysMove.splice(keysMove.indexOf(key), 1)
      keysCapture.splice(keysCapture.indexOf(key), 1)
    }
    let keysExplosion: Key[] = []
    if (props.piece.explodeOnCapture) {
      keysExplosion.push(positionToKey(position))
      for (const [x, y] of props.piece.explosionDeltas) {
        keysExplosion.push(positionToKey([x + position[0], y + position[1]]))
      }
    }
    
    const shapes: DrawShape[] = []
    for (const key of keysMove) {
      shapes.push({ orig: key, customSvg: generateCircleSvg('green') })
    }
    for (const key of keysCapture) {
      shapes.push({ orig: key, customSvg: generateCircleSvg('red') })
    }
    for (const key of keysBoth) {
      shapes.push({ orig: key, customSvg: generateCircleSvg('purple') })
    }
    for (const key of keysExplosion) {
      shapes.push({ orig: key, customSvg: generateCrossSvg('orange') })
    }
    
    // Slides
    
    const topRight = props.boardSize - 1
    if (position[0] < topRight) {
      if (props.piece.translateEast && props.piece.attackEast) {
        shapes.push(arrowShape(position, boardSize, 'right', 'purple'))
      } else if (props.piece.translateEast) {
        shapes.push(arrowShape(position, boardSize, 'right', 'green'))
      } else if (props.piece.attackEast) {
        shapes.push(arrowShape(position, boardSize, 'right', 'red'))
      }
    }
    if (position[0] > 0) {
      if (props.piece.translateWest && props.piece.attackWest) {
        shapes.push(arrowShape(position, boardSize, 'left', 'purple'))
      } else if (props.piece.translateWest) {
        shapes.push(arrowShape(position, boardSize, 'left', 'green'))
      } else if (props.piece.attackWest) {
        shapes.push(arrowShape(position, boardSize, 'left', 'red'))
      }
    }
    if (position[1] < topRight) {
      if (props.piece.translateNorth && props.piece.attackNorth) {
        shapes.push(arrowShape(position, boardSize, 'up', 'purple'))
      } else if (props.piece.translateNorth) {
        shapes.push(arrowShape(position, boardSize, 'up', 'green'))
      } else if (props.piece.attackNorth) {
        shapes.push(arrowShape(position, boardSize, 'up', 'red'))
      }
    }
    if (position[1] > 0) {
      if (props.piece.translateSouth && props.piece.attackSouth) {
        shapes.push(arrowShape(position, boardSize, 'down', 'purple'))
      } else if (props.piece.translateSouth) {
        shapes.push(arrowShape(position, boardSize, 'down', 'green'))
      } else if (props.piece.attackSouth) {
        shapes.push(arrowShape(position, boardSize, 'down', 'red'))
      }
    }
    if (position[0] < topRight && position[1] < topRight) {
      if (props.piece.translateNortheast && props.piece.attackNortheast) {
        shapes.push(arrowShape(position, boardSize, 'upright', 'purple'))
      } else if (props.piece.translateNortheast) {
        shapes.push(arrowShape(position, boardSize, 'upright', 'green'))
      } else if (props.piece.attackNortheast) {
        shapes.push(arrowShape(position, boardSize, 'upright', 'red'))
      }
    }
    if (position[0] > 0 && position[1] < topRight) {
      if (props.piece.translateNorthwest && props.piece.attackNorthwest) {
        shapes.push(arrowShape(position, boardSize, 'upleft', 'purple'))
      } else if (props.piece.translateNorthwest) {
        shapes.push(arrowShape(position, boardSize, 'upleft', 'green'))
      } else if (props.piece.attackNorthwest) {
        shapes.push(arrowShape(position, boardSize, 'upleft', 'red'))
      }
    }
    if (position[0] < topRight && position[1] > 0) {
      if (props.piece.translateSoutheast && props.piece.attackSoutheast) {
        shapes.push(arrowShape(position, boardSize, 'downright', 'purple'))
      } else if (props.piece.translateSoutheast) {
        shapes.push(arrowShape(position, boardSize, 'downright', 'green'))
      } else if (props.piece.attackSoutheast) {
        shapes.push(arrowShape(position, boardSize, 'downright', 'red'))
      }
    }
    if (position[0] > 0 && position[1] > 0) {
      if (props.piece.translateSouthwest && props.piece.attackSouthwest) {
        shapes.push(arrowShape(position, boardSize, 'downleft', 'purple'))
      } else if (props.piece.translateSouthwest) {
        shapes.push(arrowShape(position, boardSize, 'downleft', 'green'))
      } else if (props.piece.attackSouthwest) {
        shapes.push(arrowShape(position, boardSize, 'downleft', 'red'))
      }
    }
    
    return shapes
  }
  
  function generateCircleSvg(color: string): string {
    return `<circle cx="50%" cy="50%" r="40%" stroke="${color}" fill="transparent" stroke-width="10" opacity="0.7"/>`
  }
  function generateCrossSvg(color: string): string {
    return `<line x1="10%" y1="10%" x2="90%" y2="90%" stroke="${color}" stroke-width="10" />` +
      `<line x1="10%" y1="90%" x2="90%" y2="10%" stroke="${color}" stroke-width="10" />`
  }
</script>

