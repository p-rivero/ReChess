<template>
  <div class="column is-6 is-flex is-align-items-center">
    <img
      v-if="lobbySlot.creatorImage"
      class="sz-3 mr-3 is-rounded"
      :src="lobbySlot.creatorImage"
      draggable="false"
      alt="Profile image"
    >
    <div
      v-else
      class="sz-3 mr-3 icon-user color-theme"
    />
      
    <p class="adjust-text is-break-word is-size-5">
      {{ lobbySlot.creatorDisplayName }}
    </p>
    <ExternalLinkButton @click="emit('user-clicked', lobbySlot.creatorId)" />
  </div>
    
  <div
    v-if="!lobbySlot.currentUserIsCreator && lobbySlot.requestedColor === 'random'"
    class="column is-3 is-flex is-align-items-center"
  >
    <div class="sz-icon icon-dice color-theme" />
    <p class="adjust-text">
      Random side
    </p>
  </div>
  <div
    v-else-if="!lobbySlot.currentUserIsCreator"
    class="column is-3 is-flex is-align-items-center"
  >
    <div class="sz-icon icon-king-big color-theme" />
    <p class="mr-1 adjust-text">
      You play as
      <strong>
        {{ lobbySlot.requestedColor === 'white' ? 'Black' : 'White' }}
      </strong>
    </p>
  </div>
  
  
  <div
    v-if="!lobbySlot.currentUserIsCreator && !lobbySlot.challengerId"
    class="column is-3 is-flex is-align-items-center"
  >
    <button
      class="button is-fullwidth is-primary"
      @click="emit('join-slot', lobbySlot.creatorId)"
    >
      <div class="sz-icon icon-knight color-white" />
      Join
    </button>
  </div>
  <div
    v-else-if="!lobbySlot.currentUserIsCreator && lobbySlot.currentUserIsChallenger"
    class="column is-3 is-flex is-align-items-center"
  >
    <button
      class="button is-fullwidth is-primary"
      disabled
    >
      <div class="sz-icon icon-knight color-white" />
      Joining...
    </button>
  </div>
  <div
    v-else-if="!lobbySlot.currentUserIsCreator"
    class="column is-3 is-flex is-align-items-center"
  >
    <p class="is-break-word adjust-text">
      <strong>{{ lobbySlot.challengerDisplayName }}</strong> is joining...
    </p>
  </div>
    
  <div
    v-if="lobbySlot.currentUserIsCreator"
    class="column is-6 is-flex is-align-items-center is-justify-content-center"
  >
    Other players can join your game
  </div>
</template>


<script setup lang="ts">
  import ExternalLinkButton from '@/components/basic-wrappers/ExternalLinkButton.vue'
  import type { LobbySlot } from '@/stores/lobby'

  defineProps<{
    lobbySlot: LobbySlot
  }>()
  
  const emit = defineEmits<{
    (event: 'user-clicked', userId: string): void
    (event: 'join-slot', creatorId: string): void
  }>()

</script>
