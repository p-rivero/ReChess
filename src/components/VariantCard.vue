<template>
  <div class="card px-2 py-2 mx-2 my-2 is-clickable"
    @click="$router.push({ name: 'variant-details', params: { variantId: state.uid } })"
  >
    <div class="board-container w-100" ref="container">
      <ViewableChessBoard ref="board" :state="state"
      :white-pov="true" :view-only="true" :show-coordinates="true" :capture-wheel-events="false" />
    </div>
    <p class="mt-4 is-size-5 has-text-weight-semibold">{{ state.displayName }}</p>
    <p class="has-text-weight-light"> <!-- TODO: Link to user -->
      By <a>{{ state.creatorDisplayName }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
  import type { PublishedVariantGui } from '@/protochess/types'
  import { onMounted, ref } from 'vue'
  import ViewableChessBoard from './ChessBoard/ViewableChessBoard.vue'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  const props = defineProps<{
    state: PublishedVariantGui
  }>()
  
  onMounted(async () => {
    board.value?.setState(props.state)
  })
  
</script>

<style scoped lang="scss">
  .card {
    width: 18rem;
    height: fit-content; 
  }
</style>
