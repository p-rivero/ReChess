<!--
  This component is built on top of ViewableChessBoard and is meant for boards where the user controls 1 or 2 of the players.
  It uses the Protochess engine to restrict the user's moves to valid ones.
  Note that, since the Protochess object is shared, at any given time there can only be 1 instance of PlayableChessBoard.
-->


<template>
  <ViewableChessBoard 
    :size=props.size
    :white-pov=whitePov
    :view-only=viewOnly
    
    ref="board"
  />
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces';
  import { getProtochess } from '@/protochess/protochess';
  import { ref, onMounted } from 'vue';
  import ViewableChessBoard from './ViewableChessBoard.vue'
  
  const props = defineProps<{
    size: number
    userControlsWhite: boolean
    userControlsBlack: boolean
  }>()
  const whitePov = props.userControlsWhite || !props.userControlsBlack
  const viewOnly = !props.userControlsWhite && !props.userControlsBlack
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
    
  onMounted(async () => {
    // At the start, add a callback to play the user's moves
    board.value?.onMoveCallback(userMovedCallback)
  })
  
  defineExpose({
    // Set the state of the board by loading a FEN string
    loadFen: async (fen: string) => {
      const protochess = await getProtochess()
      await protochess.loadFen(fen)
      await updateBoardState()
    },
    
    // Set the state of the board
    setState: async (state: GameState) => {
      const protochess = await getProtochess()
      await protochess.setState(state)
      await updateBoardState()
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove: (from: [number, number], to: [number, number], promotion?: {color: 'white'|'black', id: string}) => {
      board.value?.makeMove(from, to, promotion)
    },
    
    // Toggle between white and black point of view
    toggleOrientation: () => {
      board.value?.toggleOrientation()
    },
    
    // Set a callback that will be called when the user makes a move (not when makeMove() is called)
    onMoveCallback: (callback: (from: [number, number], to: [number, number]) => void) => {
      board.value?.onMoveCallback(async (from, to) => {
        await userMovedCallback(from, to)
        callback(from, to)
      })
    },
    
    // Cause an explosion at the given positions
    explode: (positions: [number, number][]) => {
      board.value?.explode(positions)
    },
  })
  
  
  async function userMovedCallback(from: [number, number], to: [number, number]) {
    const protochess = await getProtochess()
    const possiblePromotions = await protochess.possiblePromotions(from[0], from[1], to[0], to[1])
    // TODO: Allow the user to choose the promotion piece
    const promotion = possiblePromotions.length > 0 ? possiblePromotions[0] : undefined
    const result = await protochess.makeMove({ from, to, promotion })
    // TODO: Handle result
    console.log(result)
    await updateBoardState()
  }
  
  // Synchonize the board state with the protochess engine
  async function updateBoardState() {
    const protochess = await getProtochess()
    const state = await protochess.getState()
    const moves = await protochess.legalMoves()
    const moveWhite = props.userControlsWhite && state.playerToMove == 0
    const moveBlack = props.userControlsBlack && state.playerToMove == 1
    board.value?.setState(state)
    board.value?.setMovable(moveWhite, moveBlack, moves)
  }
  
</script>
