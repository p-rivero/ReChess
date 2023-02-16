<template>
  <Board ref="board" :size="1000" :white-pov=true :view-only=false />
</template>

<script setup lang="ts">
  import { getProtochess } from '@/protochess/protochess';
  const board = ref<InstanceType<typeof Board>>()
  onMounted(() => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    initState(board.value)
  })
</script>

<script lang="ts">
import {ref, onMounted} from 'vue'
import Board from '@/components/ChessBoard/ChessBoard.vue'

async function initState(board: InstanceType<typeof Board>) {
  const protochess = await getProtochess()
  const state = await protochess.getState()
  board.setState(state)
  board.onMoveCallback((from, to, capturedPiece) => {
    console.log(`Move from ${from} to ${to}`)
    if (capturedPiece !== undefined) {
      console.log(`Captured ${capturedPiece.color} ${capturedPiece.role}`)
    }
  })
  
  // Wait 2 seconds and then make a move
  setTimeout(async () => {
    board.makeMove([0, 0], [1, 1], {color: 'white', char: 'q'})
  }, 2000)
}

</script>
