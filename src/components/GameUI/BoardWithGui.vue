<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100">
      <PlayableChessBoard
        ref="board"
        :white="white"
        :black="black"
        @piece-moved="pieceMoved"
        @player-changed="p => emit('player-changed', p)"
      />
      <EvaluationGauge
        v-if="hasGauge"
        ref="gauge"
        class="ml-2"
        :white-pov="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import type { CustomMoveCallback } from '@/components/ChessBoard/PlayableChessBoard.vue'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import { getProtochess } from '@/protochess'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useVariantStore } from '@/stores/variant'
  import type { GameState, MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
  import { debounce } from '@/utils/ts-utils'
  
  const route = useRoute()
  const router = useRouter()
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
    (event: 'player-changed', playerToMove: Player): void
  }>()
  
  onMounted(async () => {
    const protochess = await getProtochess()
    const state = await getState()
    if (!state) return
    // Set the board state and make sure it's valid
    await board.value?.setState(state)
    try {
      await protochess.validatePosition()
    } catch (e) {
      console.error(e)
      // Invalid position, redirect to home page
      router.push({ name: 'home' })
    }
    if (props.hasGauge) {
      await updateEvaluation()
    }
  })
  
  
  // If the variantId parameter is missing, use the stored draft variant
  async function getState(): Promise<GameState|undefined> {
    const variantId = route.params.variantId
    if (variantId && typeof variantId === 'string') {
      return getStateFromServer(variantId)
    }
    const draftStore = useVariantDraftStore()
    const draft = draftStore.state
    return draft
  }
  async function getStateFromServer(id: string): Promise<GameState|undefined> {
    const variantStore = useVariantStore()
    const variant = await variantStore.getVariant(id)
    // Variant ID is incorrect (or the uploader of this variant is malicious), redirect to home page
    if (!variant) {
      router.push({ name: 'home' })
      return
    }
    return variant
  }
  
  
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

