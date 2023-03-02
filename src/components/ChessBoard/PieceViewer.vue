<template>
  <ChessgroundAdapter
    :width="WIDTH"
    :height="HEIGHT"
    :size="props.size"
    :white-pov="true"
    :view-only="true"
    :initial-config="boardConfig"
    :piece-images="{white: [['P', image]], black: []}"
    @clicked="clicked"
    
    ref="board"
  />
</template>


<script setup lang="ts">
  import ChessgroundAdapter from './internal/ChessgroundAdapter.vue'
  import type { Config } from 'chessgroundx/config'
  import type { Key } from 'chessgroundx/types'
  import type { DrawShape } from 'chessgroundx/draw'
  import type { PieceDefinition } from '@/protochess/interfaces'
  import { keyToPosition, positionToKey } from '@/utils/chess-coords'
  import { onMounted, ref, watch } from 'vue'
  
  const props = defineProps<{
    size: number
    piece: PieceDefinition
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', delta: [number, number]): void
  }>()
  
  const image = props.piece.imageUrls[0] || props.piece.imageUrls[1] || ''
  const board = ref<InstanceType<typeof ChessgroundAdapter>>()
    
  const WIDTH = 7
  const HEIGHT = 7
  
  const PIECE_COORDS: [number, number] = [Math.floor(WIDTH/2), Math.floor(HEIGHT/2)]
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
      width: WIDTH, 
      height: HEIGHT,
    },
    drawable: {
      brushes: {
        purple: {
          key: 'purple',
          color: 'purple',
          opacity: 0.8,
          lineWidth: 20,
        },
        green: {
          key: 'green',
          color: 'green',
          opacity: 0.8,
          lineWidth: 20,
        },
        red: {
          key: 'red',
          color: 'red',
          opacity: 0.8,
          lineWidth: 20,
        },
      },
    }
  }
  
  watch(props.piece, () => board.value?.setShapes(getShapes()))
  onMounted(() => board.value?.setShapes(getShapes()))
  
  
  function clicked(key: Key) {
    const coords = keyToPosition(key)
    const delta: [number, number] = [coords[0] - PIECE_COORDS[0], coords[1] - PIECE_COORDS[1]]
    emit('clicked', delta)
  }
  
  
  function getFen(): string {
    let fen = ''
    fen += PIECE_COORDS[0]
    fen += 'P'
    fen += '/'.repeat(PIECE_COORDS[1])
    return fen
  }
  
  function getShapes(): DrawShape[] {
    // Jump deltas
    
    let keysMove: Key[] = []
    for (const [x, y] of props.piece.translateJumpDeltas) {
      keysMove.push(positionToKey([x + PIECE_COORDS[0], y + PIECE_COORDS[1]]))
    }
    let keysCapture: Key[] = []
    for (const [x, y] of props.piece.attackJumpDeltas) {
      keysCapture.push(positionToKey([x + PIECE_COORDS[0], y + PIECE_COORDS[1]]))
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
      keysExplosion.push(positionToKey(PIECE_COORDS))
      for (const [x, y] of props.piece.explosionDeltas) {
        keysExplosion.push(positionToKey([x + PIECE_COORDS[0], y + PIECE_COORDS[1]]))
      }
    }
    
    const shapes: DrawShape[] = []
    for (const key of keysMove) {
      shapes.push({orig: key, customSvg: generateCircleSvg('green')})
    }
    for (const key of keysCapture) {
      shapes.push({orig: key, customSvg: generateCircleSvg('red')})
    }
    for (const key of keysBoth) {
      shapes.push({orig: key, customSvg: generateCircleSvg('purple')})
    }
    for (const key of keysExplosion) {
      shapes.push({orig: key, customSvg: generateCrossSvg('orange')})
    }
    
    // Slides
    
    if (props.piece.translateEast && props.piece.attackEast) {
      shapes.push(arrowShape('right', 'purple'))
    } else if (props.piece.translateEast) {
      shapes.push(arrowShape('right', 'green'))
    } else if (props.piece.attackEast) {
      shapes.push(arrowShape('right', 'red'))
    }
    if (props.piece.translateWest && props.piece.attackWest) {
      shapes.push(arrowShape('left', 'purple'))
    } else if (props.piece.translateWest) {
      shapes.push(arrowShape('left', 'green'))
    } else if (props.piece.attackWest) {
      shapes.push(arrowShape('left', 'red'))
    }
    if (props.piece.translateNorth && props.piece.attackNorth) {
      shapes.push(arrowShape('up', 'purple'))
    } else if (props.piece.translateNorth) {
      shapes.push(arrowShape('up', 'green'))
    } else if (props.piece.attackNorth) {
      shapes.push(arrowShape('up', 'red'))
    }
    if (props.piece.translateSouth && props.piece.attackSouth) {
      shapes.push(arrowShape('down', 'purple'))
    } else if (props.piece.translateSouth) {
      shapes.push(arrowShape('down', 'green'))
    } else if (props.piece.attackSouth) {
      shapes.push(arrowShape('down', 'red'))
    }
    if (props.piece.translateNortheast && props.piece.attackNortheast) {
      shapes.push(arrowShape('upright', 'purple'))
    } else if (props.piece.translateNortheast) {
      shapes.push(arrowShape('upright', 'green'))
    } else if (props.piece.attackNortheast) {
      shapes.push(arrowShape('upright', 'red'))
    }
    if (props.piece.translateNorthwest && props.piece.attackNorthwest) {
      shapes.push(arrowShape('upleft', 'purple'))
    } else if (props.piece.translateNorthwest) {
      shapes.push(arrowShape('upleft', 'green'))
    } else if (props.piece.attackNorthwest) {
      shapes.push(arrowShape('upleft', 'red'))
    }
    if (props.piece.translateSoutheast && props.piece.attackSoutheast) {
      shapes.push(arrowShape('downright', 'purple'))
    } else if (props.piece.translateSoutheast) {
      shapes.push(arrowShape('downright', 'green'))
    } else if (props.piece.attackSoutheast) {
      shapes.push(arrowShape('downright', 'red'))
    }
    if (props.piece.translateSouthwest && props.piece.attackSouthwest) {
      shapes.push(arrowShape('downleft', 'purple'))
    } else if (props.piece.translateSouthwest) {
      shapes.push(arrowShape('downleft', 'green'))
    } else if (props.piece.attackSouthwest) {
      shapes.push(arrowShape('downleft', 'red'))
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
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([0, PIECE_COORDS[1]]), brush}
    } else if (dir === 'right') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([WIDTH-1, PIECE_COORDS[1]]), brush}
    } else if (dir === 'up') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([PIECE_COORDS[0], HEIGHT-1]), brush}
    } else if (dir === 'down') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([PIECE_COORDS[0], 0]), brush}
    } else if (dir === 'upleft') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([0, HEIGHT-1]), brush}
    } else if (dir === 'upright') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([WIDTH-1, HEIGHT-1]), brush}
    } else if (dir === 'downleft') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([0, 0]), brush}
    } else if (dir === 'downright') {
      return {orig: positionToKey(PIECE_COORDS), dest:positionToKey([WIDTH-1, 0]), brush}
    } else {
      throw new Error('Invalid direction')
    }
  }
</script>

