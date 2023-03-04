<template>
  <PlayableChessBoard ref='board' :size=1000 :white="'human'" :black="'human'" />
  <EvaluationGauge ref="gauge" :white-pov="true" />
</template>

<script setup lang="ts">
  import {ref, onMounted} from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { getProtochess } from '@/protochess/protochess'
  import { pairToCoords } from '@/utils/chess-coords'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  const draftStore = useVariantDraftStore()
    
  onMounted(async () => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    await board.value.setState(draftStore.state)
    board.value.onMoveCallback(updateEvaluation)
    await updateEvaluation()
  })
  
  async function updateEvaluation() {
    board.value?.clearArrows('analysis')
    const protochess = await getProtochess()
    const mv = await protochess.getBestMoveTimeout(1)
    const player = await protochess.playerToMove()
    
    gauge.value?.updateEvaluation(mv.evaluation, player === 'black')
    board.value?.drawArrow(mv.from, mv.to, 'analysis')
  }
</script>

