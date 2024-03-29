<template>
  <div class="columns">
    <div class="column is-6">
      <p class="is-size-2 mb-2 is-break-word">
        {{ variant?.displayName }}
      </p>
      
      <p
        v-if="variant?.creatorId"
        class="is-size-5 has-text-weight-semibold mb-4 is-break-word"
      >
        Created by
        <a @click="goToProfile(userStore, variant.creatorId)">
          {{ variant?.creatorDisplayName }}
        </a>
      </p>
      
      <PillList
        v-if="variant && variant.tags.length > 0"
        class="mb-5"
        :editable="false"
        :starting-pills="variant.tags"
        :prefix="'#'"
      />
      
      <UpvoteButton
        v-if="variant"
        class="mb-5"
        :variant="variant"
      />
      
      <div class="content mb-0">
        <VueMarkdown
          v-if="variant"
          class="mb-5"
          :source="variant.description"
        />
        <h4>Rules:</h4>
        <ul>
          <li
            v-for="rule of rules"
            :key="rule"
          >
            {{ rule }}
          </li>
        </ul>
        <h4>Pieces:</h4>
      </div>
      <PiecesSummary
        v-if="variant"
        :state="variant"
        :editable="false"
        @piece-click="i => pieceDetailsPopup?.show(i)"
      />
    </div>
    
    <div class="column is-6 columns reverse-columns px-0 mx-0">
      <div class="column mt-2 is-5 is-narrow">
        <RouterLink
          class="button is-primary is-fullwidth mb-4"
          :to="{ name: 'variant-lobby', params: {variantId: variant?.uid} }"
        >
          <div class="sz-icon icon-knight color-white" />
          Play
        </RouterLink>
        <RouterLink
          class="button is-fullwidth mb-4"
          :to="{ name: 'variant-analysis', params: {variantId: variant?.uid} }"
        >
          <div class="sz-icon icon-analysis color-theme" />
          Analysis board
        </RouterLink>
        <button
          class="button is-fullwidth mb-4"
          @click="useAsTemplate"
        >
          <div class="sz-icon icon-edit color-theme" />
          Use as template
        </button>
        <button
          v-if="showReportButton"
          class="button is-fullwidth mb-4"
          @click="reportVariant"
        >
          <div class="sz-icon icon-flag color-theme" />
          Report
        </button>
        <button
          v-if="authStore.loggedUser?.moderator"
          class="button is-danger is-fullwidth mb-4"
          @click="deleteVariant"
        >
          <div class="sz-icon icon-trash color-white" />
          Delete variant
        </button>
      </div>
      
      <div class="column mt-2 is-7 board-column">
        <div class="w-100 board-container">
          <div class="w-100">
            <ViewableChessBoard
              ref="board"
              class="not-clickable"
              max-height="40rem"
              :white-pov="true"
              :view-only="true"
              :show-coordinates="true"
              :capture-wheel-events="false"
              :disable-refresh="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <PieceDetailsPopup
    v-if="variant"
    ref="pieceDetailsPopup"
    :variant="variant"
  />
  <PopupWithTextbox
    ref="reportPopup"
    hint="Tell us why (optional)"
    :max-length="250"
  />
</template>


<script setup lang="ts">
  import { computed, ref, watch, watchEffect } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import VueMarkdown from 'vue-markdown-render'
  
  import { clone } from '@/helpers/ts-utils'
  import { goToProfile, returnHome } from '@/helpers/managers/navigation-manager'
  import { nTimes } from '@/helpers/locale'
  import { requestSignIn } from '@/helpers/managers/auth-manager'
  import { showPopup, showPopupImportant } from '@/helpers/managers/popup-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import { useAuthStore } from '@/stores/auth-user'
  import { useModeratorStore } from '@/stores/moderator'
  import { useUserStore } from '@/stores/user'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useVariantStore } from '@/stores/variant'
  import PieceDetailsPopup from '@/components/variant/view/PieceDetailsPopup.vue'
  import PiecesSummary from '@/components/variant/PiecesSummary.vue'
  import PillList from '@/components/PillList.vue'
  import PopupWithTextbox from '@/components/popup-message/PopupWithTextbox.vue'
  import UpvoteButton from '@/components/variant/view/UpvoteButton.vue'
  import ViewableChessBoard from '@/components/chessboard/ViewableChessBoard.vue'
  import type { PublishedVariant } from '@/protochess/types'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  const draftStore = useVariantDraftStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const moderatorStore = useModeratorStore()
  
  const variant = ref<PublishedVariant>()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const pieceDetailsPopup = ref<InstanceType<typeof PieceDetailsPopup>>()
  const reportPopup = ref<InstanceType<typeof PopupWithTextbox>>()
    
  watchEffect(async () => {
    if (route.name !== 'variant-details') return
      
    if (!route.params.variantId || typeof route.params.variantId !== 'string') {
      returnHome(400, 'This URL seems to be incorrect.')
      return
    }
    
    const newVariant = await variantStore.getVariant(route.params.variantId)
    if (!newVariant) {
      returnHome(404, 'We can\'t find the variant you were looking for.')
      return
    }
    
    board.value?.setState(newVariant)
    variant.value = newVariant
    updateTitle(newVariant.displayName)
  })
  
  watch(authStore, store => {
    if (!variant.value) return
    variant.value.loggedUserUpvoted = store.loggedUser ?
      store.loggedUser.upvotedVariants.includes(variant.value.uid) :
      false
  })
  
  const showReportButton = computed(() => {
    if (typeof route.params.variantId !== 'string') return false
    // If the user is not logged or has already reported the variant, don't show the button
    if (!authStore.loggedUser) return false
    if (authStore.loggedUser.reportedVariants.includes(route.params.variantId)) return false
    // While loading the page, show the button (usually the loaded variant can be reported)
    if (!variant.value) return true
    // When the variant is loaded, we can check if the user is the creator of the variant
    return variant.value?.creatorId !== authStore.loggedUser.uid
  })
  
  const rules = computed(() => {
    const r: string[] = []
    if (!variant.value) return r
    const gameOverResult = variant.value.globalRules.invertWinConditions ? 'lose' : 'win'
    
    if (playerHasExplodingPieces(0) && playerHasExplodingPieces(1)) {
      r.push('Watch out! Some pieces explode when they capture another piece.')
    } else if (playerHasExplodingPieces(0)) {
      r.push('Watch out! Some of White\'s pieces explode when they capture another piece.')
    } else if (playerHasExplodingPieces(1)) {
      r.push('Watch out! Some of Black\'s pieces explode when they capture another piece.')
    }
    
    if (playerHasLeader(0) && playerHasLeader(1)) {
      r.push(`If you checkmate the other player (or capture their leader), you ${gameOverResult}.`)
    } else if (playerHasLeader(0)) {
      // Black has no leader piece
      r.push(`As White, if you capture all the pieces of the other player, you ${gameOverResult}.`)
      r.push(`As Black, if you checkmate the other player (or capture their leader), you ${gameOverResult}.`)
    } else if (playerHasLeader(1)) {
      r.push(`As White, if you checkmate the other player (or capture their leader), you ${gameOverResult}.`)
      r.push(`As Black, if you capture all the pieces of the other player, you ${gameOverResult}.`)
    } else {
      r.push(`If you capture all the pieces of the other player, you ${gameOverResult}.`)
    }
    
    if (variant.value.globalRules.capturingIsForced) {
      r.push('Capturing is forced: if you can capture one or more pieces, you can only make a capture move.')
    }
    
    if (variant.value.globalRules.checkIsForbidden) {
      r.push('You cannot put the opponent in check.')
    }
    
    if (!variant.value.globalRules.stalematedPlayerLoses) {
      r.push('If you stalemate the other player, the game is a draw.')
    } else {
      r.push(`If you stalemate the other player, you ${gameOverResult}.`)
    }
    
    if (variant.value.globalRules.checksToLose > 0) {
      const checks = variant.value.globalRules.checksToLose
      r.push(`If you put the other player in check ${nTimes(checks)}, you ${gameOverResult}.`)
    }
    
    if (variant.value.globalRules.repetitionsDraw > 0) {
      const reps = variant.value.globalRules.repetitionsDraw
      r.push(`If you repeat the same position ${nTimes(reps)}, the game is a draw.`)
    }
    r.push('Click the pieces below to learn how they move.')
    
    return r
  })
  
  function useAsTemplate() {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    if (!draftStore.hasDraft()) {
      if (!variant.value) throw new Error('variant is null')
      // Nothing will be lost, so just go ahead and edit
      draftStore.state = clone(variant.value)
      router.push({ name: 'edit-draft' })
      return
    }
    const nameDetails = draftStore.state.displayName ?
      ` named "${draftStore.state.displayName}"` : ''
    showPopup(
      'Overwrite draft?',
      `You can only store one draft at a time, 
      but it seems you already have a draft${nameDetails}. 
      Do you want to overwrite it?.`,
      'yes-no',
      () => {
        if (!variant.value) throw new Error('variant is null')
        draftStore.state = clone(variant.value)
        router.push({ name: 'edit-draft' })
      }
    )
  }
  function deleteVariant() {
    showPopup(
      'Delete variant',
      'This will delete the variant and **all the games** played with it.\
      \n\nThis action cannot be undone. Do you want to continue?',
      'ok-cancel',
      async () => {
        if (!variant.value) throw new Error('variant is null')
        try {
          showPopupImportant('⌛', 'Deleting variant, please wait...', 'ok')
          await moderatorStore.deleteVariant(variant.value.uid)
          router.replace({ name: 'home' })
          showPopup(
            'Variant deleted',
            'The variant and all the games played with it have been deleted.',
            'ok'
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while deleting the variant. \
            \n\n```\n' + e + '\n```',
            'ok'
          )
        }
      }
    )
  }
  
  function reportVariant() {
    reportPopup.value?.show(
      false,
      'Report variant',
      'A moderator will review the variant and remove it if it violates our rules. \
      \n\nThis action cannot be undone.',
      'ok-cancel',
      async reason => {
        if (!variant.value) throw new Error('variant is null')
        try {
          await variantStore.reportVariant(variant.value.uid, reason)
          authStore.loggedUser?.reportedVariants.push(variant.value.uid)
          showPopup(
            'Variant reported',
            'The variant has been reported. \
            \n\nThank you for helping us keep ReChess a safe place.',
            'ok'
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while reporting the variant. \
            \n\nThis usually means that the variant has already been reported.',
            'ok'
          )
        }
      }
    )
  }
  
  
  // Returns true if a given player has a leader piece
  function playerHasLeader(player: 0|1) {
    if (!variant.value) {
      return false
    }
    for (const p of variant.value.pieceTypes) {
      if (p.isLeader && p.ids[player]) {
        return true
      }
    }
    return false
  }
  
  // Returns true if a given player has pieces that explode
  function playerHasExplodingPieces(player: 0|1) {
    if (!variant.value) {
      return false
    }
    for (const p of variant.value.pieceTypes) {
      if (p.explodeOnCapture && p.ids[player]) {
        return true
      }
    }
    return false
  }
  
</script>

<style scoped lang="scss">
  .not-clickable {
    pointer-events: none;
  }
  
  @media screen and (max-width: 1023px) {
    .reverse-columns {
      display: flex;
      flex-direction: column-reverse;
      height: fit-content;
      
      .column {
        width: 100%;
      }
    }
  }
  
  .board-column {
    padding-right: 0.75;
  }
  .board-container {
    min-height: 10rem;
    display: flex;
    align-items: center;
  }

</style>
