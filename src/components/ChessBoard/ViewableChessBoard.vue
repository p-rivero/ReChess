<!--
  This component is a higher level wrapper around the ChessgroundAdapter component.
  It's capable of rendering a Variant, but it doesn't know anything about the game engine or the rules of chess.
  You can use this component directly for view-only boards. For interactive boards (even if none of the players
  is the user, like when watching a game), use the PlayableChessBoard component instead.
  Note that the initial size of the board is 0x0, so you must call setState() for the board to be visible.
-->

<template>
  <ChessgroundAdapter
    :key="boardUpdateKey"
    ref="board"
    :style="{ maxHeight }"
    :width="currentWidth"
    :height="currentHeight"
    :white-pov="whitePov"
    :initial-config="currentBoardConfig"
    :piece-images="pieceImages"
    :capture-wheel-events="captureWheelEvents"
    :get-click-mode="getClickModeProxy"
    :disable-refresh="disableRefresh"
    :cursor-pointer="cursorPointer"
    
    @clicked="(key, mode) => emit('clicked', keyToPosition(key), mode)"
    @wheel="up => emit('wheel', up)"
  />
</template>


<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { deepMerge } from '@/utils/ts-utils'
  import { keyToPosition, positionToKey } from '@/utils/chess/chess-coords'
  import ChessgroundAdapter, { type PieceImages } from './internal/ChessgroundAdapter.vue'
  import type * as cg from 'chessgroundx/types'
  import type { Config } from 'chessgroundx/config'
  import type { InitialState, MoveInfo, MoveList, StateDiff, Variant } from '@/protochess/types'

  const props = defineProps<{
    whitePov: boolean
    maxHeight: string
    viewOnly?: boolean
    freeMode?: boolean
    showCoordinates: boolean
    captureWheelEvents: boolean
    disableRefresh?: boolean
    invertEnemyDirection?: boolean
    cursorPointer?: boolean
    getClickMode?: (position: [number, number]) => 'add'|'remove'
  }>()
  
  const emit = defineEmits<{
    (event: 'clicked', position: [number, number], mode?: 'add'|'remove'): void
    (event: 'user-moved', from: [number, number], to: [number, number]): void
    (event: 'wheel', up: boolean): void
  }>()
  
  
  const getClickModeProxy = computed(() => {
    const fn = props.getClickMode
    if (!fn) return undefined
    return (key: cg.Key) => fn(keyToPosition(key))
  })
  
  // Initial board configuration
  let currentWidth = 0
  let currentHeight = 0
  let currentBoardConfig: Config = {
    fen: ' ',
    autoCastle: false,
    disableContextMenu: true,
    blockTouchScroll: true,
    dimensions: {
      width: currentWidth,
      height: currentHeight,
    },
    movable: {
      events: {
        after: (from, to, _) => emit('user-moved', keyToPosition(from), keyToPosition(to)),
      },
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
      },
    },
    allyPieceSize: 1,
  }
  let pieceImages: PieceImages = { white: [], black: [] }
  
  // Ref to the board, and a key that is incremented every time the board is re-rendered
  const boardUpdateKey = ref(0)
  const board = ref<InstanceType<typeof ChessgroundAdapter>>()
    
  // Ensure props are updated when they change
  watch(props, () => {
    incrementalUpdateConfig({
      orientation: props.whitePov ? 'white' : 'black',
      viewOnly: props.viewOnly,
      disableContextMenu: !props.freeMode,
      coordinates: props.showCoordinates,
      highlight: { lastMove: !props.freeMode },
      selectable: { enabled: !props.freeMode },
      movable: { free: props.freeMode },
      drawable: { enabled: !props.freeMode },
      enemyPieceSize: props.invertEnemyDirection ? -1 : 1,
    })
  }, { immediate: true })
  
  defineExpose({
    // Set the state of the board
    setState(state: Variant, diff?: StateDiff) {
      if (state.boardWidth < 1 || state.boardHeight < 1) {
        throw new Error('Minimum board size is 1x1')
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
      const playerIndex = diff ? diff.playerToMove : state.playerToMove
      newConfig.turnColor = playerIndex == 0 ? 'white' : 'black'
      newConfig.check = diff ? diff.inCheck : false
      newConfig.fen = diff ? diff.fen : state.fen
      newConfig.kingRoles = getLeaderIds(state)
      incrementalUpdateConfig(newConfig)
    },
    
    // Returns the current FEN
    getFen(): string {
      return board.value?.getFen() ?? ''
    },
    
    // Returns the piece at the given position
    getPieceAt(position: [number, number]): string | undefined {
      const key = positionToKey(position)
      return board.value?.getPieceAtKey(key)
    },
    
    // Returns the list of positions that meet a given condition
    getPositionsWhere(condition: (pos: [number, number], id: string) => boolean): [number, number][] {
      const conditionKey = (key: cg.Key, piece: cg.Piece) => {
        return condition(keyToPosition(key), mappingReverse(piece))
      }
      const keys = board.value?.getKeysWhere(conditionKey) ?? []
      return keys.map(keyToPosition)
    },
    
    // Set the board, but only the parts that can change during a game
    setStateDiff(diff: StateDiff) {
      let newConfig: Config = {}
      newConfig.turnColor = diff.playerToMove == 0 ? 'white' : 'black'
      newConfig.check = diff.inCheck
      newConfig.fen = diff.fen
      incrementalUpdateConfig(newConfig)
    },
    
    // Define which sides are movable by the user
    setMovable(white: boolean, black: boolean, moves: MoveList[]) {
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
        },
      }
      incrementalUpdateConfig(newConfig)
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove(from: [number, number], to: [number, number], promotion?: string) {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      board.value?.movePiece(fromKey, toKey)
      if (promotion !== undefined) {
        this.addPiece(to, promotion)
      }
    },
    
    // Add a new piece to the board, at a given position
    addPiece(position: [number, number], pieceId: string) {
      const key = positionToKey(position)
      const piecesDiff: cg.PiecesDiff = new Map()
      piecesDiff.set(key, mappingLookup(pieceId))
      board.value?.setPieces(piecesDiff)
    },
    
    // Remove a piece from the board, at a given position
    removePiece(position: [number, number]) {
      const key = positionToKey(position)
      const piecesDiff: cg.PiecesDiff = new Map()
      piecesDiff.set(key, undefined)
      board.value?.setPieces(piecesDiff)
    },
    
    // Highlight last move
    setLastMove(move: MoveInfo) {
      const fromKey = positionToKey(move.from)
      const toKey = positionToKey(move.to)
      const newConfig: Config = {
        lastMove: [fromKey, toKey],
      }
      board.value?.setConfig(newConfig)
    },
    clearLastMove() {
      const newConfig: Config = { lastMove: [] }
      board.value?.setConfig(newConfig)
    },
    
    // Toggle between white and black point of view
    toggleOrientation() {
      board.value?.toggleOrientation()
    },
    
    // Cause an explosion at the given positions
    explode(positions: [number, number][]) {
      const keys = positions.map(positionToKey)
      board.value?.explode(keys)
    },
    
    // Draw an arrow between two positions
    drawArrow(from: [number, number], to: [number, number], brush: string, pieceId?: string) {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      const shapes = board.value?.getShapes() || []
      shapes.push({
        orig: fromKey,
        dest: toKey,
        brush,
      })
      if (pieceId) {
        shapes.push({
          orig: toKey,
          piece: mappingLookup(pieceId),
          brush,
        })
      }
      board.value?.setShapes(shapes)
    },
    
    // Clear all arrows
    clearArrows(brush: string) {
      let shapes = board.value?.getShapes()
      shapes = shapes?.filter(s => s.brush != brush) || []
      board.value?.setShapes(shapes)
    },
  })
  
  function extractImages(state: Variant): PieceImages {
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
  
  function getLeaderIds(state: InitialState): string[] {
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
  
  // Convert a custom ID to a chessgroundx piece
  function mappingLookup(id: string): cg.Piece {
    // Wall
    if (id === '*') return { role: '_-piece', color: 'none' }
    
    const mapping = currentBoardConfig.mapping ?? { whitePieces: [], blackPieces: [] }
    const whiteIndex = mapping.whitePieces.indexOf(id)
    if (whiteIndex >= 0) {
      const mappedLetter = String.fromCharCode('a'.charCodeAt(0) + whiteIndex)
      return { color: 'white', role: `${mappedLetter}-piece` as cg.Role }
    }
    const blackIndex = mapping.blackPieces.indexOf(id)
    if (blackIndex >= 0) {
      const mappedLetter = String.fromCharCode('a'.charCodeAt(0) + blackIndex)
      return { color: 'black', role: `${mappedLetter}-piece` as cg.Role }
    }
    throw new Error(`Unknown piece id: ${id}`)
  }
  // Convert a chessgroundx piece to a custom ID
  function mappingReverse(piece: cg.Piece): string {
    // Wall
    if (piece.role === '_-piece') return '*'
    
    const mapping = currentBoardConfig.mapping ?? { whitePieces: [], blackPieces: [] }
    const index = piece.role.charCodeAt(0) - 'a'.charCodeAt(0)
    if (piece.color === 'white') {
      return mapping.whitePieces[index]
    } else if (piece.color === 'black') {
      return mapping.blackPieces[index]
    }
    throw new Error(`Unknown piece: ${piece}`)
  }

</script>
