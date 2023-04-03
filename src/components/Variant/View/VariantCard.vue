<template>
  <div class="card px-2 py-2 mx-3 my-4">
    <div
      class="is-clickable"
      @click="$router.push({ name: 'variant-details', params: { variantId: variant.uid } })"
    >
      <div
        ref="container"
        class="board-container"
      >
        <ViewableChessBoard
          ref="board"
          :white-pov="true"
          :view-only="true"
          :show-coordinates="false"
          :capture-wheel-events="false"
          :disable-refresh="true"
        />
      </div>
      <div class="mt-3 is-size-5 has-text-weight-semibold is-break-word">
        <HighlightWords
          :search-words="[/* Not used */]"
          :text-to-highlight="variant.displayName"
          highlight-class-name="has-text-primary-dark"
          :find-chunks="() => highlightMatches ?? []"
        />
      </div>
    </div>
    
    <p
      v-if="variant.creatorId"
      class="mb-0 has-text-weight-light is-break-word"
    >
      By <a @click="creatorClicked">{{ variant.creatorDisplayName }}</a>
    </p>
    <div class="columns is-mobile mb-0 mt-0">
      <div class="column is-narrow pr-0">
        <button
          aria-label="use as template"
          class="button button-square px-0"
          @click="useAsTemplate"
        >
          <div class="icon-edit color-theme" />
        </button>
      </div>
      <div class="column">
        <button
          class="button is-fullwidth"
          @click="emit('play-clicked')"
        >
          <div class="sz-icon icon-knight color-theme" />
          Play
        </button>
      </div>
    </div>
    <div class="is-flex align-items-center">
      <!-- <div class="tags mr-4 mb-0">
        <span class="tag is-primary">Tag 1</span>
      </div> -->
      <div class="is-flex-grow-1" />
      <UpvoteButton :variant="props.variant" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import HighlightWords from 'vue-highlight-words'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import UpvoteButton from '@/components/Variant/View/UpvoteButton.vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useAuthStore } from '@/stores/auth-user'
  import { useUserStore } from '@/stores/user'
  import { clone } from '@/utils/ts-utils'
  import type { PublishedVariant } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const draftStore = useVariantDraftStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const router = useRouter()
  
  const props = defineProps<{
    variant: PublishedVariant
    highlightMatches?: {start: number, end: number}[]
  }>()
  
  const emit = defineEmits<{
    (event: 'play-clicked'): void
  }>()
  
  onMounted(async () => {
    board.value?.setState(props.variant)
  })
  
  function useAsTemplate() {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    if (!draftStore.hasDraft()) {
      // Nothing will be lost, so just go ahead and edit
      draftStore.state = clone(props.variant)
      router.push({ name: 'edit-variant' })
      return
    }
    const nameDetails = draftStore.state.displayName ?
      ` named "**${draftStore.state.displayName}**"` : ''
    showPopup(
      'Overwrite draft?',
      `You can only store one draft at a time, but it seems you already
      have a draft${nameDetails}. Do you want to overwrite it?`,
      'yes-no',
      () => {
        draftStore.state = clone(props.variant)
        router.push({ name: 'edit-variant' })
      }
    )
  }
  
  async function creatorClicked() {
    if (!props.variant.creatorId) {
      throw new Error('Creator should not be clickable if user has been deleted')
    }
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
