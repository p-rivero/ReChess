<!--
  This component is a higher level wrapper around the ChessgroundAdapter component.
  It's capable of rendering a GameState, but it doesn't know anything about the game engine or the rules of chess.
  You can use this component directly for view-only boards. For interactive boards, use the PlayableChessBoard component instead.
  Note that the initial size of the board is 0x0, so you must call setState() for the board to be visible.
-->

<template>
  <ChessgroundAdapter
    :width=currentWidth
    :height=currentHeight
    :size=$props.size
    :white-pov=whitePov
    :initial-config=currentBoardConfig
    :piece-images="pieceImages"
    
    :key="boardUpdateKey"
    ref="board"
  />
</template>


<script setup lang="ts">
  import type { GameStateGui, MoveList } from '@/protochess/interfaces';
  import * as cg from 'chessgroundx/types';
  import type { Config } from 'chessgroundx/config';
  import ChessgroundAdapter, { type PieceImages } from './internal/ChessgroundAdapter.vue';
  import { ref } from 'vue'

  const props = defineProps<{
    size: number
    whitePov: boolean
    viewOnly: boolean
    showCoordinates: boolean
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
    premovable: {
      enabled: false,
    },
    drawable: {
      defaultSnapToValidMove: false,
    },
  }
  let pieceImages: PieceImages = {
    white: [['K', ''], ['Q', ''], ['R', ''], ['B', ''], ['N', ''], ['P', '']],
    black: [['k', ''], ['q', ''], ['r', ''], ['b', ''], ['n', ''], ['p', '']],
  }
  
  // Ref to the board, and a key that is incremented every time the board is re-rendered
  const boardUpdateKey = ref(0);
  const board = ref<InstanceType<typeof ChessgroundAdapter>>()
  
  defineExpose({
    // Set the state of the board
    setState: (state: GameStateGui) => {
      if (state.boardWidth < 2 || state.boardHeight < 2) {
        throw new Error('Minimum board size is 2x2')
      }
      // If the size changed, re-render the board by incrementing the key counter
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
        boardUpdateKey.value += 1
      }
      // Convert the state to a chessgroundx Config
      newConfig.turnColor = state.playerToMove == 0 ? 'white' : 'black'
      newConfig.fen = state.fen
      newConfig.check = state.inCheck
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
    
    // Toggle between white and black point of view
    toggleOrientation: () => {
      board.value?.toggleOrientation()
    },
    
    // Set a callback that will be called when the user makes a move (not when makeMove() is called)
    onMoveCallback: (callback: (from: [number, number], to: [number, number]) => void) => {
      const newConfig: Config = {
        movable: {
          events: {
            after: (from, to, _) => callback(keyToPosition(from), keyToPosition(to))
          }
        }
      }
      incrementalUpdateConfig(newConfig)
    },
    
    // Cause an explosion at the given positions
    explode: (positions: [number, number][]) => {
      const keys = positions.map(positionToKey)
      board.value?.explode(keys)
    },
  })
  
  function positionToKey(position: [number, number]): cg.Key {
    if (position[0] < 0 || position[0] >= currentWidth || position[1] < 0 || position[1] >= currentHeight) {
      throw new Error('Invalid position')
    }
    return `${cg.files[position[0]]}${cg.ranks[position[1]]}`
  }
  function keyToPosition(key: cg.Key): [number, number] {
    const keyLetter = key[0] as cg.File
    const keyNumber = key[1] as cg.Rank
    const file = cg.files.indexOf(keyLetter)
    const rank = cg.ranks.indexOf(keyNumber)
    if (file < 0 || file >= currentWidth || rank < 0 || rank >= currentHeight) {
      throw new Error('Invalid key')
    }
    return [file, rank]
  }
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
        const id = pieceDef.ids[0]
        const image = pieceDef.imageUrls[0]
        if (!image) throw new Error(`Missing image for piece ${id}`)
        images.white.push([id, image])
      }
      if (pieceDef.ids[1]) {
        const id = pieceDef.ids[1]
        const image = pieceDef.imageUrls[1]
        if (!image) throw new Error(`Missing image for piece ${id}`)
        images.black.push([id, image])
      }
    }
    // Sort by id to ensure the order is consistent
    images.white.sort((a, b) => a[0].localeCompare(b[0]))
    images.black.sort((a, b) => a[0].localeCompare(b[0]))
    return images
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
