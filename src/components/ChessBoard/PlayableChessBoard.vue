<!--
  This component is built on top of ViewableChessBoard and is meant for boards where the user controls 1 or 2 of the players.
  It uses the Protochess engine to restrict the user's moves to valid ones.
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
  import { ref } from 'vue';
  import ViewableChessBoard from './ViewableChessBoard.vue'
  
  const props = defineProps<{
    size: number
    userControlsWhite: boolean
    userControlsBlack: boolean
  }>()
  const whitePov = props.userControlsWhite || !props.userControlsBlack
  const viewOnly = !props.userControlsWhite && !props.userControlsBlack
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  defineExpose({
    // Set the state of the board
    setState: (state: GameState) => {
      board.value?.setState(state)
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
      board.value?.onMoveCallback(callback)
    },
    
    // Cause an explosion at the given positions
    explode: (positions: [number, number][]) => {
      board.value?.explode(positions)
    },
  })
  
</script>
