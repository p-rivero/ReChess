<template>
  <div class="card px-2 py-2 mx-3 my-4">
    <div class="is-clickable" @click="$router.push({ name: 'variant-details', params: { variantId: state.uid } })">
      <div class="board-container" ref="container">
        <ViewableChessBoard ref="board" :state="state"
        :white-pov="true" :view-only="true" :show-coordinates="false" :capture-wheel-events="false" />
      </div>
      <p class="mt-3 is-size-5 has-text-weight-semibold">{{ state.displayName }}</p>
    </div>
    
    <p class="mb-3 has-text-weight-light" @click="creatorClicked">
      By <a>{{ state.creatorDisplayName }}</a>
    </p>
    <div class="columns">
      <div class="column">
        <button class="button is-fullwidth">
          <div class="sz-icon icon-star color-theme"></div>
          Play
        </button>
      </div>
    </div>
    <div class="is-flex align-items-center">
      <!-- <div class="tags mr-4 mb-0">
        <span class="tag is-primary">Tag 1</span>
      </div> -->
      <div class="is-flex-grow-1"></div>
      <button class="heart-button button mb-2">
        <p class="mr-3">{{numUpvotes}}</p>
        <div class="sz-icon icon-heart color-theme"></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PublishedVariantGui } from '@/protochess/types'
  import { onMounted, ref, computed } from 'vue'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  const props = defineProps<{
    state: PublishedVariantGui
  }>()
  
  const numUpvotes = computed(() => {
    if (props.state.numUpvotes > 1000) {
      return (props.state.numUpvotes / 1000).toFixed(1) + 'k'
    }
    return props.state.numUpvotes
  })
  
  onMounted(async () => {
    board.value?.setState(props.state)
  })
  
  
  async function creatorClicked() {
    console.log('creator clicked', props.state.creatorId)
  }
  
</script>

<style scoped lang="scss">
  .card {
    width: 17rem;
    height: fit-content; 
  }
  .board-container {
    min-height: 7rem;
    display: flex;
    align-items: center;
  }
  .heart-button {
    padding-right: 0.5rem;
  }
</style>
