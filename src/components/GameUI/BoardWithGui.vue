<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100">
      <PlayableChessBoard ref='board' :white="white" :black="black" @piece-moved="pieceMoved"/>
      <EvaluationGauge v-if="hasGauge" class="ml-2" ref="gauge" :white-pov="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import type { CustomMoveCallback } from '@/components/ChessBoard/PlayableChessBoard.vue'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import { getProtochess } from '@/protochess'
  import type { GameState, MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
  import { debounce } from '@/utils/ts-utils'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  
  const props = defineProps<{
    white: 'human' | 'engine' | CustomMoveCallback
    black: 'human' | 'engine' | CustomMoveCallback
    hasGauge: boolean
  }>()
  
  
  const emit = defineEmits<{
    (event: 'piece-moved', from?: [number, number], to?: [number, number]): void
    (event: 'game-over', flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player): void
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
  
  
  const updateEvalDebounced = debounce(updateEvaluation, 500)
  async function pieceMoved(from?: [number, number], to?: [number, number], result?: {flag: MakeMoveFlag, winner: MakeMoveWinner}) {
    if (result !== undefined) {
      await gameOver(result.flag, result.winner)
    }
    if (!result && props.hasGauge) {
      await updateEvalDebounced()
    }
    emit ('piece-moved', from, to)
  }
  
  async function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner) {
    if (flag === 'Ok' || flag === 'IllegalMove') {
      throw new Error('Invalid flag emitted from PlayableChessBoard: ' + flag)
    }
    if (!board.value) {
      throw new Error('Reference to board is undefined')
    }
    const playerToMove = await board.value.playerToMove()
    board.value.clearArrows('analysis')
    if (props.hasGauge) {
      gauge.value?.gameOver(flag, winner, playerToMove)
    }
    emit('game-over', flag, winner, playerToMove)
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

