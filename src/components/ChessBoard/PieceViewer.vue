<template>
  <ChessgroundAdapter
    ref="board"
    :width="props.width"
    :height="props.height"
    :white-pov="true"
    :view-only="true"
    :initial-config="boardConfig"
    :piece-images="{white: [['P', image]], black: []}"
    :capture-wheel-events="false"
    :get-click-mode="getClickModeProxy"
    
    @clicked="clicked"
  />
</template>


<script setup lang="ts">
  import ChessgroundAdapter from './internal/ChessgroundAdapter.vue'
  import type { Config } from 'chessgroundx/config'
  import type { Key } from 'chessgroundx/types'
  import type { DrawShape } from 'chessgroundx/draw'
  import type { FullPieceDef } from '@/protochess/types'
  import { keyToPosition, positionToKey } from '@/utils/chess/chess-coords'
  import { onMounted, ref, watch, computed } from 'vue'
  
  const props = defineProps<{
    piece: FullPieceDef
    width: number
    height: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    getClickMode?: (position: [number, number]) => 'add'|'remove'
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', delta: [number, number], mode?: 'add'|'remove'): void
  }>()
  
  defineExpose({
    redraw: () => board.value?.redrawAll(),
  })
  
  const image = computed(() => props.piece.imageUrls[0] || props.piece.imageUrls[1] || '')
  const board = ref<InstanceType<typeof ChessgroundAdapter>>()
    
  const getClickModeProxy = computed(() => {
    const fn = props.getClickMode
    if (!fn) return undefined
    return (key: Key) => {
      const coords = keyToPosition(key)
      const delta: [number, number] = [coords[0] - piece_coords[0], coords[1] - piece_coords[1]]
      return fn(delta)
    }
  })
    
  watch(props.piece, () => board.value?.setShapes(getShapes()))
  onMounted(() => board.value?.setShapes(getShapes()))
  
  let piece_coords: [number, number]
  if (props.position === 'center') {
    piece_coords = [Math.floor(props.width/2), Math.floor(props.height/2)]
  } else if (props.position === 'top-left') {
    piece_coords = [0, props.height-1]
  } else if (props.position === 'top-right') {
    piece_coords = [props.width-1, props.height-1]
  } else if (props.position === 'bottom-left') {
    piece_coords = [0, 0]
  } else if (props.position === 'bottom-right') {
    piece_coords = [props.width-1, 0]
  }
  
  
  const boardConfig: Config = {
    mapping: {
      whitePieces: ['P'],
      blackPieces: [],
    },
    fen: getFen(),
    viewOnly: true,
    disableContextMenu: true,
    blockTouchScroll: true,
    coordinates: false,
    dimensions: {
      width: props.width,
      height: props.height,
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
  }
  
  
  function clicked(key: Key, mode?: 'add'|'remove') {
    const coords = keyToPosition(key)
    const delta: [number, number] = [coords[0] - piece_coords[0], coords[1] - piece_coords[1]]
    emit('clicked', delta, mode)
  }
  
  
  function getFen(): string {
    let fen = ''
    fen += piece_coords[0]
    fen += 'P'
    fen += '/'.repeat(piece_coords[1])
    return fen
  }
  
  function getShapes(): DrawShape[] {
    // Jump deltas
    
    let keysMove: Key[] = []
    for (const [x, y] of props.piece.translateJumpDeltas) {
      keysMove.push(positionToKey([x + piece_coords[0], y + piece_coords[1]]))
    }
    let keysCapture: Key[] = []
    for (const [x, y] of props.piece.attackJumpDeltas) {
      keysCapture.push(positionToKey([x + piece_coords[0], y + piece_coords[1]]))
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
    if (props.piece.explodes) {
      keysExplosion.push(positionToKey(piece_coords))
      for (const [x, y] of props.piece.explosionDeltas) {
        keysExplosion.push(positionToKey([x + piece_coords[0], y + piece_coords[1]]))
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
    
    if (piece_coords[0] < props.width-1) {
      if (props.piece.translateEast && props.piece.attackEast) {
        shapes.push(arrowShape('right', 'purple'))
      } else if (props.piece.translateEast) {
        shapes.push(arrowShape('right', 'green'))
      } else if (props.piece.attackEast) {
        shapes.push(arrowShape('right', 'red'))
      }
    }
    if (piece_coords[0] > 0) {
      if (props.piece.translateWest && props.piece.attackWest) {
        shapes.push(arrowShape('left', 'purple'))
      } else if (props.piece.translateWest) {
        shapes.push(arrowShape('left', 'green'))
      } else if (props.piece.attackWest) {
        shapes.push(arrowShape('left', 'red'))
      }
    }
    if (piece_coords[1] < props.height-1) {
      if (props.piece.translateNorth && props.piece.attackNorth) {
        shapes.push(arrowShape('up', 'purple'))
      } else if (props.piece.translateNorth) {
        shapes.push(arrowShape('up', 'green'))
      } else if (props.piece.attackNorth) {
        shapes.push(arrowShape('up', 'red'))
      }
    }
    if (piece_coords[1] > 0) {
      if (props.piece.translateSouth && props.piece.attackSouth) {
        shapes.push(arrowShape('down', 'purple'))
      } else if (props.piece.translateSouth) {
        shapes.push(arrowShape('down', 'green'))
      } else if (props.piece.attackSouth) {
        shapes.push(arrowShape('down', 'red'))
      }
    }
    if (piece_coords[0] < props.width-1 && piece_coords[1] < props.height-1) {
      if (props.piece.translateNortheast && props.piece.attackNortheast) {
        shapes.push(arrowShape('upright', 'purple'))
      } else if (props.piece.translateNortheast) {
        shapes.push(arrowShape('upright', 'green'))
      } else if (props.piece.attackNortheast) {
        shapes.push(arrowShape('upright', 'red'))
      }
    }
    if (piece_coords[0] > 0 && piece_coords[1] < props.height-1) {
      if (props.piece.translateNorthwest && props.piece.attackNorthwest) {
        shapes.push(arrowShape('upleft', 'purple'))
      } else if (props.piece.translateNorthwest) {
        shapes.push(arrowShape('upleft', 'green'))
      } else if (props.piece.attackNorthwest) {
        shapes.push(arrowShape('upleft', 'red'))
      }
    }
    if (piece_coords[0] < props.width-1 && piece_coords[1] > 0) {
      if (props.piece.translateSoutheast && props.piece.attackSoutheast) {
        shapes.push(arrowShape('downright', 'purple'))
      } else if (props.piece.translateSoutheast) {
        shapes.push(arrowShape('downright', 'green'))
      } else if (props.piece.attackSoutheast) {
        shapes.push(arrowShape('downright', 'red'))
      }
    }
    if (piece_coords[0] > 0 && piece_coords[1] > 0) {
      if (props.piece.translateSouthwest && props.piece.attackSouthwest) {
        shapes.push(arrowShape('downleft', 'purple'))
      } else if (props.piece.translateSouthwest) {
        shapes.push(arrowShape('downleft', 'green'))
      } else if (props.piece.attackSouthwest) {
        shapes.push(arrowShape('downleft', 'red'))
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
  function arrowShape(dir: 'left' | 'right' | 'up' | 'down' | 'upleft' | 'upright' | 'downleft' | 'downright', brush: string): DrawShape {
    if (dir === 'left') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([0, piece_coords[1]]), brush }
    } else if (dir === 'right') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([props.width-1, piece_coords[1]]), brush }
    } else if (dir === 'up') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([piece_coords[0], props.height-1]), brush }
    } else if (dir === 'down') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([piece_coords[0], 0]), brush }
    } else if (dir === 'upleft') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([0, props.height-1]), brush }
    } else if (dir === 'upright') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([props.width-1, props.height-1]), brush }
    } else if (dir === 'downleft') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([0, 0]), brush }
    } else if (dir === 'downright') {
      return { orig: positionToKey(piece_coords), dest:positionToKey([props.width-1, 0]), brush }
    } else {
      throw new Error('Invalid direction')
    }
  }
</script>

