<template>
  <div v-if="draftStore.hasDraft()" class="card draft-card px-2 py-2 mx-3 my-4">
    <div class="is-clickable" @click="editDraft">
      <div class="board-container" ref="container">
        <ViewableChessBoard ref="board" :white-pov="true" :view-only="true" :show-coordinates="false" :capture-wheel-events="false" />
      </div>
      <p class="mt-3 is-size-5 has-text-weight-semibold">{{ draftStore.state.displayName }}</p>
    </div>
    <p class="mb-3 has-text-weight-light is-italic">
      Your private draft
    </p>
    <div class="columns is-mobile">
      <div class="column is-narrow pr-0">
        <button aria-label="edit variant" class="button button-square px-0" @click="discardDraft">
          <div class="icon-trash color-theme"></div>
        </button>
      </div>
      <div class="column">
        <button class="button is-fullwidth" @click="editDraft">
          <div class="sz-icon icon-edit color-theme"></div>
          Edit draft
        </button>
      </div>
    </div>
  </div>
  <div v-else-if="draftStore.seeCreateHint" class="draft-card outline px-2 py-2 mx-3 my-4 is-clickable" @click="editDraft">
    <p class="has-text-weight-light my-6">
      Create your own!
    </p>
    <button class="button is-small" @click.stop="hideCreateHint">
      <div class="sz-icon icon-cross color-theme"></div>
      Hide
    </button>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import type { GameStateGui } from '@/protochess/types'
  import { placementsToFen } from '@/utils/chess/fen-to-placements'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const draftStore = useVariantDraftStore()
  const router = useRouter()
  
  onMounted(async () => {
    if (!draftStore.hasDraft()) {
      return
    }
    const stateGui: GameStateGui = {
      ...draftStore.state,
      fen: placementsToFen(draftStore.state),
      inCheck: false,
    }
    board.value?.setState(stateGui)
  })
  
  
  function editDraft() {
    router.push({ name: 'edit-variant' })
  }
  
  function discardDraft() {
    showPopup(
      'Discard draft?',
      'This will delete your draft and you will not be able to recover it.',
      'ok-cancel',
      () => draftStore.discardDraft(),
    )
  }
  
  function hideCreateHint() {
    showPopup(
      'This hint won\'t be shown again',
      'You can always create a new variant from scratch by clicking the "Create" button\
        in the top navigation bar. You can also use any existing variant as a template to create your own.',
      'ok-cancel',
      draftStore.hideCreateHint,
    )
  }
  
</script>

<style scoped lang="scss">
  .draft-card {
    width: 17rem;
    height: fit-content;
    &.outline {
      border: 2px dashed;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 22rem;
    }
    [data-theme="light"] &.outline {
      border-color: #aaa;
      &:hover {
        border-color: #888;
      }
    }
    [data-theme="dark"] &.outline {
      border-color: #555;
      &:hover {
        border-color: #777;
      }
    }
  }
  .board-container {
    min-height: 7rem;
    display: flex;
    align-items: center;
  }
</style>
