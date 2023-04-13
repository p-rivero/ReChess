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
      @click="playPopup?.show(side => router.push({ name: 'play-offline', query: {startAs: side} }))"
    >
      <div class="sz-icon icon-cpu color-theme" />
      Against computer
    </button>
    <button
      class="button"
      @click="router.push({ name: 'play-offline', query: {mode: 'otb'} })"
    >
      <div class="sz-icon icon-people color-theme" />
      Over the board
    </button>
  </div>
  
  
  <p class="is-size-5 pt-6 mb-3 has-text-weight-semibold">
    Online lobby
  </p>
  
  <div
    v-for="slot of slots"
    :key="slot.creatorId"
    class="mx-0 my-5 px-2 py-2 card columns"
  >
    <div class="column is-6 is-flex is-align-items-center">
      <div class="sz-icon icon-user color-theme" />
      <p class="adjust-text is-break-word">
        {{ slot.creatorDisplayName }}
      </p>
      <div
        class="pl-3 pr-2 py-2 is-clickable"
        @click="userClicked(slot.creatorId)"
      >
        <div class="sz-icon icon-external-link color-primary-dark" />
      </div>
    </div>
    
    
    <div
      v-if="!slot.isFromCurrentUser && slot.requestedColor === 'random'"
      class="column is-3 is-flex is-align-items-center"
    >
      <div class="sz-icon icon-dice color-theme" />
      <p class="adjust-text">
        Random side
      </p>
    </div>
    <div
      v-else-if="!slot.isFromCurrentUser"
      class="column is-3 is-flex is-align-items-center"
    >
      <div class="sz-icon icon-king-big color-theme" />
      <p class="mr-1 adjust-text">
        You play as
        <strong>
          {{ slot.requestedColor === 'white' ? 'Black' : 'White' }}
        </strong>
      </p>
    </div>
      
    <div
      v-if="!slot.isFromCurrentUser"
      class="column is-3"
    >
      <button
        class="button is-fullwidth is-primary"
        @click="joinSlotClicked"
      >
        <div class="sz-icon icon-knight color-white" />
        Join
      </button>
    </div>
    
    <div
      v-else
      class="column is-6 is-flex is-align-items-center is-justify-content-center"
    >
      Other players can join your game
    </div>
  </div>
  
  
  <div
    v-if="slots.length === 0"
    :style="{ visibility: fetched ? 'visible' : 'hidden' }"
    class="py-2 is-flex is-align-items-center is-justify-content-center"
  >
    <div class="sz-2 mr-2 icon-sad color-theme" />
    There's no one here yet. Be the first to create a game!
  </div>
  
  <button
    class="button is-primary mt-2"
    @click="createGameClicked"
  >
    <div class="sz-icon icon-add color-white" />
    Create a new game
  </button>
  
  
  <p class="is-size-5 pt-6 mb-3 has-text-weight-semibold">
    Ongoing games
  </p>
  <p>
    TODO
  </p>
  
  <PlayPopup ref="playPopup" />
  <LobbyWaitingPopup
    ref="waitPopup"
    @cancel="lobbyStore.cancelSlot(variant!.uid)"
  />
</template>


<script setup lang="ts">
  import { onUnmounted, ref, watchEffect } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  
  import { useVariantStore } from '@/stores/variant'
  import { useUserStore } from '@/stores/user'
  import { useAuthStore } from '@/stores/auth-user'
  import { useLobbyStore, type LobbySlot } from '@/stores/lobby'
  import type { PublishedVariant } from '@/protochess/types'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import LobbyWaitingPopup from '@/components/GameUI/LobbyWaitingPopup.vue'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { updateTitle } from '@/utils/web-utils'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const lobbyStore = useLobbyStore()
  
  const variant = ref<PublishedVariant>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  const waitPopup = ref<InstanceType<typeof LobbyWaitingPopup>>()
  const slots = ref<LobbySlot[]>([])
  const fetched = ref(false)
  
  // When the route changes, update the variant
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
    
    variant.value = newVariant
    updateTitle('Play ' + newVariant.displayName)
    
    lobbyStore.setUpdateListener(newVariant.uid, s => {
      slots.value = s
      fetched.value = true
    })
    lobbyStore.onLobbyCreated(color => {
      waitPopup.value?.show(color)
    })
    lobbyStore.onLobbyDeleted(() => {
      waitPopup.value?.hide()
    })
  })
  
  onUnmounted(() => {
    lobbyStore.removeListeners()
  })
  
  
  async function createGameClicked() {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    const currentVariant = variant.value
    if (!currentVariant) {
      throw new Error('Variant must be set')
    }
    playPopup.value?.show(side => lobbyStore.createSlot(currentVariant.uid, side))
  }
  
  async function joinSlotClicked() {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    // TODO
  }
  
  async function userClicked(userId: string) {
    // Get the username of the creator
    const user = await userStore.getUserById(userId)
    if (!user) {
      throw new Error('Could not find user with id ' + userId)
    }
    const location = router.resolve({ name: 'user-profile', params: { username: user.username } })
    // Open the user's profile in a new tab
    window.open(location.href, '_blank')
  }
  
</script>
