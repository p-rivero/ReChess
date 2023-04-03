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
        <a @click="creatorClicked">{{ variant?.creatorDisplayName }}</a>
      </p>
      
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
            v-for="rule in rules"
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
        <button
          class="button is-primary is-fullwidth mb-4"
          @click="playPopup?.show(variant?.uid)"
        >
          <div class="sz-icon icon-knight color-white" />
          Play
        </button>
        <button
          class="button is-fullwidth mb-4"
          @click="$router.push({ name: 'analysis', params: {variantId: variant?.uid} })"
        >
          <div class="sz-icon icon-analysis color-theme" />
          Analysis board
        </button>
        <button
          class="button is-fullwidth mb-4"
          @click="useAsTemplate"
        >
          <div class="sz-icon icon-edit color-theme" />
          Use as template
        </button>
        <button
          v-if="authStore.loggedUser && variant?.creatorId !== authStore.loggedUser.uid"
          class="button is-fullwidth mb-4"
        >
          <div class="sz-icon icon-report color-theme" />
          Report
        </button>
      </div>
      
      <div class="column mt-2 is-7 board-column">
        <div class="w-100">
          <ViewableChessBoard
            ref="board"
            class="not-clickable"
            :white-pov="true"
            :view-only="true"
            :show-coordinates="true"
            :capture-wheel-events="false"
          />
        </div>
      </div>
    </div>
  </div>
  <PlayPopup ref="playPopup" />
  <PieceDetailsPopup
    v-if="variant"
    ref="pieceDetailsPopup"
    :variant="variant"
  />
</template>


<script setup lang="ts">
  import { computed, ref, watchEffect } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import VueMarkdown from 'vue-markdown-render'
  
  import { useVariantStore } from '@/stores/variant'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useAuthStore } from '@/stores/auth-user'
  import { useUserStore } from '@/stores/user'
  import type { PublishedVariant } from '@/protochess/types'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import PieceDetailsPopup from '@/components/Variant/View/PieceDetailsPopup.vue'
  import UpvoteButton from '@/components/Variant/View/UpvoteButton.vue'
  import PiecesSummary from '@/components/Variant/PiecesSummary.vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { clone } from '@/utils/ts-utils'
  import { nTimes } from '@/utils/locale'
  import { updateTitle } from '@/utils/web-utils'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  const draftStore = useVariantDraftStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  const variant = ref<PublishedVariant>()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  const pieceDetailsPopup = ref<InstanceType<typeof PieceDetailsPopup>>()
    
  watchEffect(async () => {
    if (!route.params.variantId || typeof route.params.variantId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    // Get variant info from the server
    const newVariant = await variantStore.getVariant(route.params.variantId)
    if (!newVariant) {
      // Variant ID is incorrect (or the uploader of this variant is malicious), redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    board.value?.setState(newVariant)
    variant.value = newVariant
    updateTitle(newVariant.displayName)
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
      router.push({ name: 'edit-variant' })
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
        router.push({ name: 'edit-variant' })
      }
    )
  }
  
  async function creatorClicked() {
    if (!variant.value) {
      throw new Error('variant is null')
    }
    if (!variant.value.creatorId) {
      throw new Error('Creator should not be clickable if user has been deleted')
    }
    // Get the username of the creator
    const user = await userStore.getUserById(variant.value.creatorId)
    if (!user) {
      throw new Error('Could not find user with id ' + variant.value.creatorId)
    }
    router.push({ name: 'user-profile', params: { username: user.username } })
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
      if (p.explodes && p.ids[player]) {
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

</style>
