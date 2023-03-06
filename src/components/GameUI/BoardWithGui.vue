<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100">
      <PlayableChessBoard ref='board' :white="white" :black="black" @piece-moved="pieceMoved" @game-over="gameOver"/>
      <EvaluationGauge v-if="hasGauge" class="ml-2" ref="gauge" :white-pov="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {ref, onMounted} from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import type { CustomMoveCallback } from '@/components/ChessBoard/PlayableChessBoard.vue'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import { getProtochess } from '@/protochess/protochess'
  import type { GameState, MakeMoveFlag, MakeMoveWinner } from '@/protochess/interfaces'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  
  const props = defineProps<{
    white: 'human' | 'engine' | CustomMoveCallback
    black: 'human' | 'engine' | CustomMoveCallback
    hasGauge: boolean
  }>()
  
  
  defineExpose({
    async setState(state: GameState) {
      if (board.value === undefined) {
        throw new Error('Reference to board is undefined')
      }
      await board.value.setState(state)
      if (props.hasGauge) {
        await updateEvaluation()
      }
    }
  })
  
  
  async function pieceMoved(_from: [number, number], _to: [number, number]) {
    if (props.hasGauge) {
      await updateEvaluation()
    }
  }
  
  function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner) {
    if (flag === 'Ok' || flag === 'IllegalMove') {
      throw new Error('Invalid flag emitted from PlayableChessBoard: ' + flag)
    }
    board.value?.clearArrows('analysis')
    if (props.hasGauge) {
      gauge.value?.gameOver(winner)
    }
    console.log('Game over: ' + flag + ' ' + winner)
  }
  
  async function updateEvaluation() {
    board.value?.clearArrows('analysis')
    const protochess = await getProtochess()
    const mv = await protochess.getBestMoveTimeout(1)
    const player = await protochess.playerToMove()
    
    gauge.value?.updateEvaluation(mv.evaluation, mv.depth, player === 'black')
    board.value?.drawArrow(mv.from, mv.to, 'analysis')
  }
</script>

