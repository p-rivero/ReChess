<!--
  This component is a higher level wrapper around the ChessgroundAdapter component.
  It's capable of rendering a GameState, but it doesn't know anything about the game engine or the rules of chess.
  You can use this component directly for view-only boards. For interactive boards, use the PlayableChessBoard component instead.
  Note that the initial size of the board is 0x0, so you must call setState() for the board to be visible.
-->

<template>
  <ChessBoardVisual
    :width=currentWidth
    :height=currentHeight
    :size=$props.size
    :white-pov=whitePov
    :view-only=$props.viewOnly
    :board-config=currentBoardConfig
    
    :key="boardUpdateKey"
    ref="board"
  />
</template>


<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces';
  import * as cg from 'chessgroundx/types';
  import type { Config } from 'chessgroundx/config';
  import ChessBoardVisual from './internal/ChessgroundAdapter.vue';
  import { ref } from 'vue'

  const props = defineProps<{
    size: number
    whitePov: boolean
    viewOnly: boolean
  }>()
  
  // Initial board configuration
  let currentWidth = 0
  let currentHeight = 0
  let currentBoardConfig: Config = {
    orientation: props.whitePov ? 'white' : 'black',
    turnColor: 'white',
    autoCastle: false,
    viewOnly: props.viewOnly,
    disableContextMenu: true,
    blockTouchScroll: true,
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
  
  // Ref to the board, and a key that is incremented every time the board is re-rendered
  const boardUpdateKey = ref(0);
  const board = ref<InstanceType<typeof ChessBoardVisual>>()
  
  defineExpose({
    // Set the state of the board
    setState: (state: GameState) => {
      if (state.validSquares.length == 0) {
        throw new Error('There must be at least one valid square in the board')
      }
      const newWidth = Math.max(...state.validSquares.map(([x, _]) => x)) + 1
      const newHeight = Math.max(...state.validSquares.map(([_, y]) => y)) + 1
      // If the size changed, re-render the board by incrementing the key counter
      if (newWidth != currentWidth || newHeight != currentHeight) {
        currentWidth = newWidth
        currentHeight = newHeight
        currentBoardConfig.dimensions = { width: newWidth, height: newHeight }
        boardUpdateKey.value += 1
      }
      // TODO: Convert the state to a chessgroundx Config
      board.value?.setConfig(currentBoardConfig)
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove: (from: [number, number], to: [number, number], promotion?: {color: 'white'|'black', char: string}) => {
      let fromKey = positionToKey(from)
      let toKey = positionToKey(to)
      board.value?.movePiece(fromKey, toKey)
      if (promotion !== undefined) {
        const role = `${promotion.char}-piece` as cg.Role
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
      currentBoardConfig = { ...currentBoardConfig, ...newConfig }
      board.value?.setConfig(currentBoardConfig)
    },
  })
  
  function positionToKey(position: [number, number]): cg.Key {
    if (position[0] < 0 || position[0] >= currentWidth || position[1] < 0 || position[1] >= currentHeight) {
      throw new Error('Invalid position')
    }
    return `${cg.files[position[0]]}${cg.ranks[position[1]]}`
  }
  function keyToPosition(key: cg.Key): [number, number] {
    let keyLetter = key[0] as cg.File
    let keyNumber = key[1] as cg.Rank
    const file = cg.files.indexOf(keyLetter)
    const rank = cg.ranks.indexOf(keyNumber)
    if (file < 0 || file >= currentWidth || rank < 0 || rank >= currentHeight) {
      throw new Error('Invalid key')
    }
    return [file, rank]
  }

</script>
