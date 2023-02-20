<template>
  <PlayableChessBoard ref='board' :size=1000 :user-controls-white=true :user-controls-black=true />
</template>

<script setup lang="ts">
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  onMounted(() => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    initState(board.value)
  })
</script>

<script lang="ts">
import {ref, onMounted} from 'vue'
import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'

async function initState(board: InstanceType<typeof PlayableChessBoard>) {
  board.loadFen('rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPPPP///PPPPPPPPP/PPPPPPPP/PPPPPKPP w kq - 0 1')
  board.onMoveCallback(async (from, to) => {
    console.log(`Move from ${from} to ${to}`)
  })
  
  // Wait 2 seconds and then make a move
  // const makeEngineMove = async () => {
  //   const result = await protochess.playBestMove(7)
  //   const state = await protochess.getState()
  //   const moves = await protochess.legalMoves()
  //   board.setState(state, moves)
  //   if (result.result === 'Ok') {
  //     // setTimeout(makeEngineMove, 10)
  //   }
  // }
  // setTimeout(makeEngineMove, 10)
}

</script>
