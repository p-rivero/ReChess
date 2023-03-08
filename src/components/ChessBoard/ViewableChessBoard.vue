<!--
  This component is a higher level wrapper around the ChessgroundAdapter component.
  It's capable of rendering a GameState, but it doesn't know anything about the game engine or the rules of chess.
  You can use this component directly for view-only boards. For interactive boards (even if none of the players
  is the user, like when watching a game), use the PlayableChessBoard component instead.
  Note that the initial size of the board is 0x0, so you must call setState() for the board to be visible.
-->

<template>
  <ChessgroundAdapter
    :width="currentWidth"
    :height="currentHeight"
    :white-pov="whitePov"
    :initial-config="currentBoardConfig"
    :piece-images="pieceImages"
    :capture-wheel-events="captureWheelEvents"
    @clicked="key => emit('clicked', keyToPosition(key))"
    @wheel="up => emit('wheel', up)"
    
    :key="boardUpdateKey"
    ref="board"
  />
</template>


<script setup lang="ts">
  import type { GameStateGui, MoveList } from '@/protochess/types';
  import type * as cg from 'chessgroundx/types';
  import { positionToKey, keyToPosition } from '@/utils/chess-coords';
  import type { Config } from 'chessgroundx/config';
  import ChessgroundAdapter, { type PieceImages } from './internal/ChessgroundAdapter.vue';
  import { ref } from 'vue'

  const props = defineProps<{
    whitePov: boolean
    viewOnly: boolean
    showCoordinates: boolean
    captureWheelEvents: boolean
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', position: [number, number]): void
    (event: 'user-moved', from: [number, number], to: [number, number]): void
    (event: 'wheel', up: boolean): void
  }>()
  
  // Initial board configuration
  let currentWidth = 0
  let currentHeight = 0
  let currentBoardConfig: Config = {
    orientation: props.whitePov ? 'white' : 'black',
    fen: ' ',
    autoCastle: false,
    viewOnly: props.viewOnly,
    disableContextMenu: true,
    blockTouchScroll: true,
    coordinates: props.showCoordinates,
    dimensions: {
      width: currentWidth, 
      height: currentHeight,
    },
    movable: {
      events: {
        after: (from, to, _) => emit('user-moved', keyToPosition(from), keyToPosition(to))
      }
    },
    premovable: {
      enabled: false,
    },
    drawable: {
      eraseOnClick: false,
      defaultSnapToValidMove: false,
      brushes: {
        analysis: {
          key: 'analysis',
          color: '#244b9e',
          opacity: 0.5,
          lineWidth: 15,
        },
      }
    },
  }
  let pieceImages: PieceImages = { white: [], black: [] }
  
  // Ref to the board, and a key that is incremented every time the board is re-rendered
  const boardUpdateKey = ref(0);
  const board = ref<InstanceType<typeof ChessgroundAdapter>>()
  
  defineExpose({
    // Set the state of the board
    setState: (state: GameStateGui) => {
      if (state.boardWidth < 2 || state.boardHeight < 2) {
        throw new Error('Minimum board size is 2x2')
      }
      let newConfig: Config = {}
      if (state.boardWidth != currentWidth || state.boardHeight != currentHeight) {
        currentWidth = state.boardWidth
        currentHeight = state.boardHeight
        newConfig.dimensions = { width: state.boardWidth, height: state.boardHeight }
        boardUpdateKey.value += 1
      }
      // If the piece images changed, re-render the board
      const newPieceImages = extractImages(state)
      if (JSON.stringify(newPieceImages) != JSON.stringify(pieceImages)) {
        pieceImages = newPieceImages
        newConfig.mapping = {
          whitePieces: pieceImages.white.map(([id, _]) => id),
          blackPieces: pieceImages.black.map(([id, _]) => id),
        }
        boardUpdateKey.value += 1
      }
      // Convert the state to a chessgroundx Config
      newConfig.turnColor = state.playerToMove == 0 ? 'white' : 'black'
      newConfig.check = state.inCheck
      newConfig.fen = state.fen
      newConfig.kingRoles = getLeaderIds(state)
      incrementalUpdateConfig(newConfig)
    },
    
    // Define which sides are movable by the user
    setMovable: (white: boolean, black: boolean, moves: MoveList[]) => {
      let dests = new Map<cg.Orig, cg.Key[]>()
      for (const mv of moves) {
        const fromKey = positionToKey([mv.x, mv.y])
        const toKeys = mv.moves.map(m => positionToKey(m.to))
        dests.set(fromKey, toKeys)
      }
      const newConfig: Config = {
        movable: {
          color: white && black ? 'both' : white ? 'white' : black ? 'black' : 'none' as cg.Color,
          free: false,
          dests,
        }
      }
      incrementalUpdateConfig(newConfig)
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove: (from: [number, number], to: [number, number], promotion?: {color: 'white'|'black', id: string}) => {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      board.value?.movePiece(fromKey, toKey)
      if (promotion !== undefined) {
        const role = idToRole(promotion.id)
        const piecesDiff: Map<cg.Key, cg.Piece> = new Map()
        piecesDiff.set(toKey, {color: promotion.color, role, promoted: true})
        board.value?.setPieces(piecesDiff)
      }
    },
    
    // Highlight last move
    highlightMove: (from: [number, number], to: [number, number]) => {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      const newConfig: Config = {
        lastMove: [fromKey, toKey],
      }
      incrementalUpdateConfig(newConfig)
    },
    clearHighlightMove: () => {
      const newConfig: Config = { lastMove: [] }
      incrementalUpdateConfig(newConfig)
    },
    
    // Toggle between white and black point of view
    toggleOrientation: () => {
      board.value?.toggleOrientation()
    },
    
    // Cause an explosion at the given positions
    explode: (positions: [number, number][]) => {
      const keys = positions.map(positionToKey)
      board.value?.explode(keys)
    },
    
    // Draw an arrow between two positions
    drawArrow: (from: [number, number], to: [number, number], brush: string) => {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      const shapes = board.value?.getShapes() || []
      shapes.push({
        orig: fromKey,
        dest: toKey,
        brush,
      })
      board.value?.setShapes(shapes)
    },
    
    // Clear all arrows
    clearArrows: (brush: string) => {
      let shapes = board.value?.getShapes()
      shapes = shapes?.filter(s => s.brush != brush) || []
      board.value?.setShapes(shapes)
    },
    
    // Redraw the board
    redraw: () => {
      board.value?.redrawAll()
    },
  })
  
  function idToRole(id: string): cg.Role {
    return `${id}-piece` as cg.Role
  }
  
  function extractImages(state: GameStateGui): PieceImages {
    const images: PieceImages = {
      white: [],
      black: [],
    }
    for (const pieceDef of state.pieceTypes) {
      if (pieceDef.ids[0]) {
        images.white.push([pieceDef.ids[0], pieceDef.imageUrls[0] ?? ''])
      }
      if (pieceDef.ids[1]) {
        images.black.push([pieceDef.ids[1], pieceDef.imageUrls[1] ?? ''])
      }
    }
    // Sort by id to ensure the order is consistent
    images.white.sort((a, b) => a[0].localeCompare(b[0]))
    images.black.sort((a, b) => a[0].localeCompare(b[0]))
    return images
  }
  
  function getLeaderIds(state: GameStateGui): string[] {
    const roles: string[] = []
    for (const pieceDef of state.pieceTypes) {
      if (pieceDef.isLeader) {
        if (pieceDef.ids[0]) roles.push(pieceDef.ids[0])
        if (pieceDef.ids[1]) roles.push(pieceDef.ids[1])
      }
    }
    return roles
  }
  
  
  function incrementalUpdateConfig(newConfig: Config) {
    deepMerge(currentBoardConfig, newConfig)
    board.value?.setConfig(currentBoardConfig)
  }
  function deepMerge(base: any, extend: any): void {
    for (const key in extend) {
      // TODO: Call directly
      if (Object.prototype.hasOwnProperty.call(extend, key)) {
        if (Object.prototype.hasOwnProperty.call(base, key) && isPlainObject(base[key]) && isPlainObject(extend[key]))
          deepMerge(base[key], extend[key]);
        else base[key] = extend[key];
      }
    }
  }
  // TODO: Remove
  function isPlainObject(o: any) {
    if (typeof o !== 'object' || o === null)
      return false;
    const proto = Object.getPrototypeOf(o);
    return proto === Object.prototype || proto === null;
  }

</script>
