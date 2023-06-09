<template>
  <div class="card px-2 py-2 mx-3 my-4">
    <RouterLink
      class="no-color"
      :to="{ name: 'variant-details', params: { variantId: variant.uid } }"
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
            :cursor-pointer="true"
          />
        </div>
      </div>
      <div class="mt-3 is-size-5 has-text-weight-semibold is-break-word">
        <HighlightWords
          :search-words="[/* Not used */]"
          :text-to-highlight="variant.displayName"
          highlight-class-name="has-text-primary-dark"
          :find-chunks="() => highlightMatches ?? []"
        />
      </div>
    </RouterLink>
    
    <p
      v-if="variant.creatorId"
      class="mb-0 has-text-weight-light is-break-word"
    >
      By <a @click="goToProfile(userStore, variant.creatorId)">{{ variant.creatorDisplayName }}</a>
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
        <RouterLink
          class="button is-fullwidth"
          :to="{ name: 'variant-lobby', params: {variantId: variant.uid} }"
        >
          <div class="sz-icon icon-knight color-theme" />
          Play
        </RouterLink>
      </div>
    </div>
    <div
      v-if="variant.tags.length > 0"
      class="tags mb-2"
    >
      <span
        v-for="tag of variant.tags.slice(0, 5)"
        :key="tag"
        class="tag is-primary is-outlined is-clickable"
        :data-tooltip="getTextWidth(tag) > remToPx(15) ? tag : undefined"
        @click="emit('tag-clicked', tag)"
      >
        <span class="is-size-6 mr-1 adjust-text"> # </span>
        <span class="tag-text"> {{ tag }}</span>
      </span>
    </div>
    <div class="is-flex align-items-center">
      <div class="is-flex-grow-1" />
      <UpvoteButton :variant="props.variant" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { clone } from '@/helpers/ts-utils'
  import { getTextWidth, remToPx } from '@/helpers/web-utils'
  import { goToProfile } from '@/helpers/managers/navigation-manager'
  import { onMounted, ref } from 'vue'
  import { requestSignIn } from '@/helpers/managers/auth-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import HighlightWords from 'vue-highlight-words'
  import UpvoteButton from '@/components/variant/view/UpvoteButton.vue'
  import ViewableChessBoard from '@/components/chessboard/ViewableChessBoard.vue'
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
    (event: 'tag-clicked', tag: string): void
  }>()
  
  onMounted(() => {
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
      router.push({ name: 'edit-draft' })
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
        router.push({ name: 'edit-draft' })
      }
    )
  }
  
</script>

<style scoped lang="scss">
  .card {
    width: 17rem;
    height: fit-content;
  }
  .board-container {
    min-height: 7rem;
  }
  
  .tag {
    border-radius: 1rem;
    border-bottom: 0;
    .tag-text {
      max-width: 13rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
