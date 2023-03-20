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
    <div class="columns is-mobile mb-0">
      <div class="column is-narrow pr-0">
        <button aria-label="use as template" class="button button-square px-0" @click="useAsTemplate">
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
      <UpvoteButton :variant="props.variant" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PublishedVariantGui } from '@/protochess/types'
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import UpvoteButton from '@/components/ViewVariant/UpvoteButton.vue'
  import { showPopup } from '@/components/Popup/popup-manager'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useUserStore } from '@/stores/user'
  import { clone } from '@/utils/ts-utils'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const draftStore = useVariantDraftStore()
  const userStore = useUserStore()
  const router = useRouter()
  
  const props = defineProps<{
    variant: PublishedVariantGui
  }>()
  
  const emit = defineEmits<{
    (event: 'play-clicked'): void
    (event: 'edit-variant'): void
  }>()
  
  onMounted(async () => {
    board.value?.setState(props.variant)
  })
  
  function useAsTemplate() {
    if (!draftStore.hasDraft()) {
      // Nothing will be lost, so just go ahead and edit
      draftStore.state = clone(props.variant)
      emit('edit-variant')
      return
    }
    const nameDetails = draftStore.state.displayName ?
      ` named "${draftStore.state.displayName}"` : ''
    showPopup('Overwrite draft?', `You can only store one draft at a time, 
      but it seems you already have a draft${nameDetails}. 
      Do you want to overwrite it?.`,
      'yes-no',
      () => {
        draftStore.state = clone(props.variant)
        emit('edit-variant')
      }
    )
  }
  
  async function creatorClicked() {
    // Get the username of the creator
    const user = await userStore.getUserById(props.variant.creatorId)
    if (!user) {
      throw new Error('Could not find user with id ' + props.variant.creatorId)
    }
    router.push({ name: 'user-profile', params: { username: user.username } })
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
</style>
