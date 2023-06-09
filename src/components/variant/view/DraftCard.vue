<template>
  <div
    v-if="draftStore.hasDraft()"
    class="card draft-card px-2 py-2 mx-3 my-4"
  >
    <RouterLink
      class="no-color"
      :to="{ name: 'edit-draft' }"
    >
      <div
        ref="container"
        class="board-container is-flex is-align-items-center"
      >
        <div class="w-100">
          <ViewableChessBoard
            ref="board"
            max-height="20rem"
            :white-pov="true"
            :view-only="true"
            :show-coordinates="false"
            :capture-wheel-events="false"
            :disable-refresh="true"
          />
        </div>
      </div>
      <p class="mt-3 is-size-5 has-text-weight-semibold is-break-word">
        {{ draftStore.state.displayName }}
      </p>
    </RouterLink>
    <p class="mb-3 has-text-weight-light is-italic">
      Your private draft
    </p>
    <div class="columns is-mobile">
      <div class="column is-narrow pr-0">
        <button
          aria-label="edit variant"
          class="button button-square px-0"
          @click="discardDraft"
        >
          <div class="icon-trash color-theme" />
        </button>
      </div>
      <div class="column">
        <RouterLink
          class="button is-fullwidth"
          :to="{ name: 'edit-draft' }"
        >
          <div class="sz-icon icon-edit color-theme" />
          Edit draft
        </RouterLink>
      </div>
    </div>
  </div>
  <RouterLink
    v-else-if="userPrefsStore.seeCreateHint"
    class="draft-card outline px-2 py-2 mx-3 my-4 no-color"
    :to="{ name: 'edit-draft' }"
  >
    <p class="has-text-weight-light my-6">
      Create your own!
    </p>
    <button
      class="button is-small"
      @click.stop="hideCreateHint"
    >
      <div class="sz-icon icon-cross color-theme" />
      Hide
    </button>
  </RouterLink>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { useUserPrefsStore } from '@/stores/user-preferences'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import ViewableChessBoard from '@/components/chessboard/ViewableChessBoard.vue'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const draftStore = useVariantDraftStore()
  const userPrefsStore = useUserPrefsStore()
  
  onMounted(() => {
    if (!draftStore.hasDraft()) {
      return
    }
    board.value?.setState(draftStore.state)
  })
  
  function discardDraft() {
    showPopup(
      'Discard draft?',
      'This will delete your draft and you will not be able to recover it.',
      'ok-cancel',
      () => draftStore.discardDraft()
    )
  }
  
  function hideCreateHint() {
    showPopup(
      'This hint won\'t be shown again',
      'You can always create a new variant from scratch by clicking the **Create** button in the top navigation bar. \
      \n\nYou can also use any existing variant as a template to create your own.',
      'ok-cancel',
      () => userPrefsStore.seeCreateHint = false
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
  }
</style>
