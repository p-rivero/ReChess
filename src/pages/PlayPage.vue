<template>
  <Board ref='board' :size=1000 :user-controls-white=true :user-controls-black=true />
</template>

<script setup lang="ts">
  import { getProtochess } from '@/protochess/protochess';
  import type { MoveInfo } from '@/protochess/interfaces';
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
import Board from '@/components/ChessBoard/PlayableChessBoard.vue'

async function initState(board: InstanceType<typeof Board>) {
  const protochess = await getProtochess()
  await protochess.setNumThreads(1)
  await protochess.loadFen('rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPPPP///PPPPPPPPP/PPPPPPPP/PPPPPKPP w kq - 0 1 ATOMIC')
  const state = await protochess.getState()
  board.setState(state)
  board.onMoveCallback((from, to) => {
    console.log(`Move from ${from} to ${to}`)
  })
  
  // Wait 2 seconds and then make a move
  setTimeout(async () => {
    // await protochess.playBestMove(5)
    const state = await protochess.getState()
    
    board.setState(state)
  }, 200)
}

</script>
