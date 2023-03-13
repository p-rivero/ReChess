<template>
  <div class="card px-4 py-4 mx-2 my-2 is-clickable"
    @click="$router.push({ name: 'variant-details', params: { variantId: state.variantUID } })"
  >
    <div class="board-container w-100" ref="container">
      <ViewableChessBoard ref="board" :state="state"
      :white-pov="true" :view-only="true" :show-coordinates="true" :capture-wheel-events="false" />
    </div>
    <p class="mt-4 is-size-5 has-text-weight-medium">{{ state.variantDisplayName }}</p>
  </div>
</template>

<script setup lang="ts">
  import type { GameState, GameStateGui } from '@/protochess/types'
  import { placementsToFen } from '@/utils/chess/fen-to-placements'
  import { onMounted, ref } from 'vue'
  import ViewableChessBoard from './ChessBoard/ViewableChessBoard.vue'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  const props = defineProps<{
    state: GameState
  }>()
  
  onMounted(async () => {
    const fen = placementsToFen(props.state)
    const stateGui: GameStateGui = {
      ...props.state,
      fen,
      inCheck: false,
    }
    board.value?.setState(stateGui)
  })
  
</script>

<style scoped lang="scss">
  .card {
    width: 20rem;
    height: fit-content; 
  }
</style>
