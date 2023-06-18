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
  import { type Direction, arrowShape } from '@/helpers/chess/slide-arrow-shape'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { intersection } from '@/helpers/ts-utils'
  import { keyToPosition, positionToKey } from '@/helpers/chess/chess-coords'
  import ChessgroundAdapter from './internal/ChessgroundAdapter.vue'
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
    return [
      ...getJumpDeltasShapes(position),
      ...getSlidesShapes(position, boardSize),
    ]
  }
  
  function getJumpDeltasShapes(position: [number, number]): DrawShape[] {
    const keysMove: Key[] = []
    for (const [dx, dy] of props.piece.translateJumpDeltas) {
      keysMove.push(positionToKey([dx + position[0], dy + position[1]]))
    }
    const keysCapture: Key[] = []
    for (const [dx, dy] of props.piece.attackJumpDeltas) {
      keysCapture.push(positionToKey([dx + position[0], dy + position[1]]))
    }
    const keysBoth = intersection(keysMove, keysCapture)
    
    const keysExplosion: Key[] = []
    if (props.piece.explodeOnCapture) {
      keysExplosion.push(positionToKey(position))
      for (const [dx, dy] of props.piece.explosionDeltas) {
        keysExplosion.push(positionToKey([position[0] + dx, position[1] + dy]))
      }
    }
    
    return [
      ...keysToShapes(keysMove, generateCircleSvg('green')),
      ...keysToShapes(keysCapture, generateCircleSvg('red')),
      ...keysToShapes(keysBoth, generateCircleSvg('purple')),
      ...keysToShapes(keysExplosion, generateCrossSvg('orange')),
    ]
  }
  
  function getSlidesShapes(position: [number, number], boardSize: number): DrawShape[] {
    const shapes: DrawShape[] = []
    const piece = props.piece
    
    const boardEdge = boardSize - 1
    if (position[0] < boardEdge) {
      shapes.push(...slideArrow(position, boardSize, 'right', piece.translateEast, piece.attackEast))
    }
    if (position[0] > 0) {
      shapes.push(...slideArrow(position, boardSize, 'left', piece.translateWest, piece.attackWest))
    }
    if (position[1] < boardEdge) {
      shapes.push(...slideArrow(position, boardSize, 'up', piece.translateNorth, piece.attackNorth))
    }
    if (position[1] > 0) {
      shapes.push(...slideArrow(position, boardSize, 'down', piece.translateSouth, piece.attackSouth))
    }
    if (position[0] < boardEdge && position[1] < boardEdge) {
      shapes.push(...slideArrow(position, boardSize, 'upright', piece.translateNortheast, piece.attackNortheast))
    }
    if (position[0] > 0 && position[1] < boardEdge) {
      shapes.push(...slideArrow(position, boardSize, 'upleft', piece.translateNorthwest, piece.attackNorthwest))
    }
    if (position[0] < boardEdge && position[1] > 0) {
      shapes.push(...slideArrow(position, boardSize, 'downright', piece.translateSoutheast, piece.attackSoutheast))
    }
    if (position[0] > 0 && position[1] > 0) {
      shapes.push(...slideArrow(position, boardSize, 'downleft', piece.translateSouthwest, piece.attackSouthwest))
    }
    return shapes
  }
  
  function slideArrow(position: [number,number], boardSize: number, arrowDir: Direction, move: boolean, capture: boolean): DrawShape[] {
    if (move && capture) {
      return [arrowShape(position, boardSize, arrowDir, 'purple')]
    }
    if (move) {
      return [arrowShape(position, boardSize, arrowDir, 'green')]
    }
    if (capture) {
      return [arrowShape(position, boardSize, arrowDir, 'red')]
    }
    return []
  }
  
  function keysToShapes(keys: Key[], svg: string): DrawShape[] {
    return keys.map(key => ({ orig: key, customSvg: svg }))
  }
  
  function generateCircleSvg(color: string): string {
    return `<circle cx="50%" cy="50%" r="40%" stroke="${color}" fill="transparent" stroke-width="10" opacity="0.7"/>`
  }
  function generateCrossSvg(color: string): string {
    return `<line x1="10%" y1="10%" x2="90%" y2="90%" stroke="${color}" stroke-width="10" />` +
      `<line x1="10%" y1="90%" x2="90%" y2="10%" stroke="${color}" stroke-width="10" />`
  }
</script>

