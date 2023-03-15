<template>
  <div class="card px-2 py-2 mx-3 my-4">
    <div class="is-clickable" @click="$router.push({ name: 'variant-details', params: { variantId: variant.uid } })">
      <div class="board-container" ref="container">
        <ViewableChessBoard ref="board" :white-pov="true" :view-only="true" :show-coordinates="false" :capture-wheel-events="false" />
      </div>
      <p class="mt-3 is-size-5 has-text-weight-semibold">{{ variant.displayName }}</p>
    </div>
    
    <p class="mb-3 has-text-weight-light" @click="creatorClicked">
      By <a>{{ variant.creatorDisplayName }}</a>
    </p>
    <div class="columns is-mobile">
      <div class="column is-narrow pr-0">
        <button aria-label="edit variant" class="button button-square px-0" @click="editVariant">
          <div class="icon-edit color-theme"></div>
        </button>
      </div>
      <div class="column">
        <button class="button is-fullwidth" @click="emit('play-clicked')">
          <div class="sz-icon icon-knight color-theme"></div>
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
  import { showPopup } from '@/components/Popup/popup-manager'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { clone } from '@/utils/ts-utils'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const draftStore = useVariantDraftStore()
  
  const props = defineProps<{
    variant: PublishedVariantGui
  }>()
  
  const emit = defineEmits<{
    (event: 'play-clicked'): void
    (event: 'edit-variant'): void
  }>()
  
  
  const numUpvotes = computed(() => {
    if (props.variant.numUpvotes > 1000) {
      return (props.variant.numUpvotes / 1000).toFixed(1) + 'k'
    }
    return props.variant.numUpvotes
  })
  
  onMounted(async () => {
    board.value?.setState(props.variant)
  })
  
  function editVariant() {
    if (!draftStore.hasDraft()) {
      // Nothing will be lost, so just go ahead and edit
      draftStore.state = clone(props.variant)
      emit('edit-variant')
      return
    }
    const nameDetails = draftStore.state.displayName ?
      ` named "${draftStore.state.displayName}"` : ''
    showPopup('Overwrite draft?', `You can only store 1 draft at a time, 
      but it seems you already have a draft${nameDetails}. 
      If you decide to continue, it will be overwritten.`,
      'ok-cancel',
      () => {
        draftStore.state = clone(props.variant)
        emit('edit-variant')
      }
    )
  }
  
  async function creatorClicked() {
    console.log('creator clicked', props.variant.creatorId)
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
