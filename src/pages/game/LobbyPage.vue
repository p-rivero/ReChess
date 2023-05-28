<template>
  <p class="is-size-2 mb-6 is-break-word">
    Play {{ variant?.displayName }}
  </p>
  
  <p class="is-size-5 mb-3 has-text-weight-semibold">
    Play offline
  </p>
  
  <div class="field is-grouped is-grouped-multiline">
    <button
      class="button mr-2 mb-2"
      @click="playPopup?.showWithLevels((side, level) => router.push({ name: 'play-offline', query: {startAs: side, lvl: level} }))"
    >
      <div class="sz-icon icon-cpu color-theme" />
      Against computer
    </button>
    <RouterLink
      class="button"
      :to="{ name: 'play-offline', query: {mode: 'otb'} }"
    >
      <div class="sz-icon icon-people color-theme" />
      Over the board
    </RouterLink>
  </div>
  
  
  <p class="is-size-5 pt-6 mb-3 has-text-weight-semibold">
    Online lobby
  </p>
  
  <div
    v-for="slot of lobbySlots"
    :key="slot.creatorId"
    class="mx-0 my-5 card columns"
  >
    <LobbySlotView
      :lobby-slot="slot"
      @user-clicked="id => goToProfile(userStore, id, true)"
      @join-slot="joinSlotClicked"
    />
  </div>
  
  
  <div
    v-if="lobbySlots.length === 0"
    :style="{ visibility: lobbyFetched ? 'visible' : 'hidden' }"
    class="py-2 is-flex is-align-items-center is-justify-content-center"
  >
    <div class="sz-2 mr-2 icon-cactus color-theme" />
    <p class="adjust-text">
      There's no one here yet. Be the first to create a game!
    </p>
  </div>
  
  <button
    class="button is-primary mt-2"
    @click="createGameClicked"
  >
    <div class="sz-icon icon-add color-white" />
    Create a new game
  </button>
  
  
  <p
    v-if="ongoingSlots.length > 0"
    class="is-size-5 pt-6 mb-3 has-text-weight-semibold"
  >
    Ongoing games
  </p>
  <div
    v-for="slot of ongoingSlots"
    :key="slot.gameId"
    class="mx-0 my-5 card columns"
  >
    <OngoingGameView
      :game-slot="slot"
      @user-clicked="id => goToProfile(userStore, id, true)"
    />
  </div>
  
  <PlayPopup ref="playPopup" />
  <LobbyWaitingPopup
    ref="waitPopup"
    @cancel="cancelGameClicked"
    @accept-challenger="acceptChallengerClicked"
    @reject-challenger="rejectChallengerClicked"
  />
  <LobbyJoiningPopup
    ref="joiningPopup"
    @cancel="cancelJoiningClicked"
  />
</template>


<script setup lang="ts">
  import { onUnmounted, ref, watchEffect } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  import { type LobbySlot, type OngoingGameSlot, useLobbyStore } from '@/stores/lobby'
  import { goToProfile, returnHome } from '@/helpers/managers/navigation-manager'
  import { requestSignIn } from '@/helpers/managers/auth-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import { useAuthStore } from '@/stores/auth-user'
  import { useUserStore } from '@/stores/user'
  import { useVariantStore } from '@/stores/variant'
  import LobbyJoiningPopup from '@/components/lobby/LobbyChallengerPopup.vue'
  import LobbySlotView from '@/components/lobby/LobbySlotView.vue'
  import LobbyWaitingPopup from '@/components/lobby/LobbyCreatorPopup.vue'
  import OngoingGameView from '@/components/lobby/OngoingGameView.vue'
  import PlayPopup from '@/components/game-ui/PlayPopup.vue'
  import type { PublishedVariant } from '@/protochess/types'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const lobbyStore = useLobbyStore()
  
  const variant = ref<PublishedVariant>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  const waitPopup = ref<InstanceType<typeof LobbyWaitingPopup>>()
  const joiningPopup = ref<InstanceType<typeof LobbyJoiningPopup>>()
    
  const lobbySlots = ref<LobbySlot[]>([])
  const lobbyFetched = ref(false)
  const ongoingSlots = ref<OngoingGameSlot[]>([])
  
  // TODO: Detect page close and leave lobby
  
  // When the route changes, update the variant
  watchEffect(async () => {
    if (route.name !== 'variant-lobby') return
    
    if (!route.params.variantId || typeof route.params.variantId !== 'string') {
      returnHome(400, 'This URL seems to be incorrect.')
      return
    }
    
    // Get variant info from the server
    const newVariant = await variantStore.getVariant(route.params.variantId)
    if (!newVariant) {
      returnHome(404, 'We can\'t find the variant you were looking for.')
      return
    }
    
    variant.value = newVariant
    updateTitle('Play ' + newVariant.displayName)
    
    lobbyStore.onLobbyLoaded(slotList => {
      lobbySlots.value = slotList
      lobbyFetched.value = true
    })
    lobbyStore.onOngoingLoaded(slotList => {
      ongoingSlots.value = slotList
    })
    lobbyStore.onLobbyCreated(color => {
      waitPopup.value?.show(color)
    })
    lobbyStore.onLobbyDeleted(() => {
      waitPopup.value?.hide()
    })
    lobbyStore.onChallengerJoined(challenger => {
      waitPopup.value?.challengerJoined(challenger)
    })
    lobbyStore.onChallengerLeft(() => {
      waitPopup.value?.challengerLeft()
    })
    lobbyStore.onJoinSlot((id, name) => {
      joiningPopup.value?.show(id, name)
    })
    lobbyStore.onKickedFromSlot(() => {
      joiningPopup.value?.hide()
      showPopup(
        'Cannot join game',
        'The game creator has declined your request to join the game.',
        'ok'
      )
    })
    lobbyStore.onGameCreated((gameId, creatorId) => {
      router.push({ name: 'play-online', params: { gameId } })
      lobbyStore.removeSlot(creatorId).catch(e => {
        console.error(e)
        showPopup(
          'Unable to remove slot',
          'There has been an unexpected error while cleaning up the lobby. Please try again later.',
          'ok'
        )
      })
    })
    
    // This will call the listeners above
    lobbyStore.listenForUpdates(newVariant.uid)
  })
  
  onUnmounted(() => {
    lobbyStore.removeListeners()
  })
  
  
  async function createGameClicked() {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    playPopup.value?.show(async side => {
      // When the user selects a side, try to create the slot
      try {
        await lobbyStore.createSlot(side)
      } catch (e) {
        console.error(e)
        showPopup(
          'Unable to create game',
          'There has been an unexpected error while creating the game. Please try again later.',
          'ok'
        )
      }
    })
  }
  
  async function joinSlotClicked(id: string) {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    try {
      await lobbyStore.joinSlot(id)
    } catch (e) {
      console.error(e)
      showPopup(
        'Unable to join game',
        'There has been an unexpected error while joining the game. Please try again later.',
        'ok'
      )
    }
  }
  
  async function cancelGameClicked() {
    try {
      await lobbyStore.cancelSlot()
    } catch (e) {
      console.error(e)
      showPopup(
        'Unable to cancel game',
        'There has been an unexpected error while canceling the game. Please try again later.',
        'ok'
      )
    }
  }
  
  async function acceptChallengerClicked() {
    try {
      const gameId = await lobbyStore.acceptChallenger()
      router.push({ name: 'play-online', params: { gameId } })
    } catch (e) {
      console.error(e)
      showPopup(
        'Unable to accept',
        'There has been an unexpected error. Please try again later.',
        'ok'
      )
    }
  }
  
  async function rejectChallengerClicked() {
    try {
      await lobbyStore.rejectChallenger()
    } catch (e) {
      console.error(e)
      showPopup(
        'Unable to reject',
        'There has been an unexpected error. Please try again later.',
        'ok'
      )
    }
  }
  
  async function cancelJoiningClicked(creatorId: string) {
    try {
      await lobbyStore.cancelJoining(creatorId)
    } catch (e) {
      console.error(e)
      showPopup(
        'Unable to cancel',
        'There has been an unexpected error. Please try again later.',
        'ok'
      )
    }
  }
  
</script>
