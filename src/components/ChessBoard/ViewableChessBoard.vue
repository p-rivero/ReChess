<!--
  This component is a higher level wrapper around the ChessgroundAdapter component.
  It's capable of rendering a GameState, but it doesn't know anything about the game engine or the rules of chess.
  You can use this component directly for view-only boards. For interactive boards (even if none of the players
  is the user, like when watching a game), use the PlayableChessBoard component instead.
  Note that the initial size of the board is 0x0, so you must call setState() for the board to be visible.
-->

<template>
  <ChessgroundAdapter
    :key="boardUpdateKey"
    ref="board"
    :width="currentWidth"
    :height="currentHeight"
    :white-pov="whitePov"
    :initial-config="currentBoardConfig"
    :piece-images="pieceImages"
    :capture-wheel-events="captureWheelEvents"
    :get-click-mode="getClickModeProxy"
    :disable-refresh="disableRefresh"
    
    @clicked="(key, mode) => emit('clicked', keyToPosition(key), mode)"
    @wheel="up => emit('wheel', up)"
  />
</template>


<script setup lang="ts">
  import type { GameStateGui, MoveList, Player } from '@/protochess/types'
  import type * as cg from 'chessgroundx/types'
  import { positionToKey, keyToPosition } from '@/utils/chess/chess-coords'
  import type { Config } from 'chessgroundx/config'
  import ChessgroundAdapter, { type PieceImages } from './internal/ChessgroundAdapter.vue'
  import { computed, ref, watch } from 'vue'
  import { deepMerge } from '@/utils/ts-utils'

  const props = defineProps<{
    whitePov: boolean
    viewOnly?: boolean
    freeMode?: boolean
    showCoordinates: boolean
    captureWheelEvents: boolean
    disableRefresh?: boolean
    invertEnemyDirection?: boolean
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
    setState(state: GameStateGui) {
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
    makeMove(from: [number, number], to: [number, number], promotion?: {color: Player, id: string}) {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      board.value?.movePiece(fromKey, toKey)
      if (promotion !== undefined) {
        const role = idToRole(promotion.id)
        const piecesDiff: Map<cg.Key, cg.Piece> = new Map()
        piecesDiff.set(toKey, { color: promotion.color, role, promoted: true })
        board.value?.setPieces(piecesDiff)
      }
    },
    
    // Highlight last move
    highlightMove(from: [number, number], to: [number, number]) {
      const fromKey = positionToKey(from)
      const toKey = positionToKey(to)
      const newConfig: Config = {
        lastMove: [fromKey, toKey],
      }
      board.value?.setConfig(newConfig)
    },
    clearHighlightMove() {
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
    
    // Redraw the board
    redraw() {
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
  
  // Convert a custom ID to a chessgroundx piece
  function mappingLookup(id: string): cg.Piece {
    const mapping = currentBoardConfig.mapping ?? { whitePieces: [], blackPieces: [] }
    const whiteIndex = mapping.whitePieces.indexOf(id)
    if (whiteIndex >= 0) {
      const mappedLetter = String.fromCharCode('a'.charCodeAt(0) + whiteIndex)
      return { color: 'white', role: idToRole(mappedLetter) }
    }
    const blackIndex = mapping.blackPieces.indexOf(id)
    if (blackIndex >= 0) {
      const mappedLetter = String.fromCharCode('a'.charCodeAt(0) + blackIndex)
      return { color: 'black', role: idToRole(mappedLetter) }
    }
    throw new Error(`Unknown piece id: ${id}`)
  }

</script>
