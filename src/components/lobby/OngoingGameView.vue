<template>
  <div class="column is-4 is-flex is-align-items-center is-justify-content-center">
    <div class="sz-2 mr-2 px-1 has-background-light rounded-corners">
      <div
        v-if="gameSlot.playerToMove === 'white'"
        class="sz-100 icon-knight color-black"
      />
    </div>
    <p class="adjust-text is-break-word is-size-5 has-text-centered">
      {{ gameSlot.whiteDisplayName }}
    </p>
    <ExternalLinkButton @click="emit('user-clicked', gameSlot.whiteId)" />
  </div>
  
  <div class="column is-1 py-0 is-flex is-align-items-center is-justify-content-center">
    vs.
  </div>
  
  <div class="column is-4 is-flex is-align-items-center is-justify-content-center">
    <div class="sz-2 mr-2 px-1 has-background-dark rounded-corners">
      <div
        v-if="gameSlot.playerToMove === 'black'"
        class="sz-100 icon-knight color-white"
      />
    </div>
    <p class="adjust-text is-break-word is-size-5 has-text-centered">
      {{ gameSlot.blackDisplayName }}
    </p>
    <ExternalLinkButton @click="emit('user-clicked', gameSlot.blackId)" />
  </div>
  
  <div class="column is-3 is-flex is-align-items-center">
    <RouterLink
      class="button is-fullwidth is-primary"
      :to="{ name: 'play-online', params: { gameId: gameSlot.gameId } }"
    >
      <div
        class="sz-icon color-white"
        :class="{
          'icon-knight': gameSlot.currentUserIsPlayer,
          'icon-eye': !gameSlot.currentUserIsPlayer,
        }"
      />
      {{ gameSlot.currentUserIsPlayer ? 'Resume' : 'Watch' }}
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
  import ExternalLinkButton from '@/components/basic-wrappers/ExternalLinkButton.vue'
  import type { OngoingGameSlot } from '@/stores/lobby'

  defineProps<{
    gameSlot: OngoingGameSlot
  }>()
  
  const emit = defineEmits<{
    (event: 'user-clicked', userId: string): void
  }>()
  

</script>


<style scoped lang="scss">
  .rounded-corners {
    border-radius: 0.25rem;
  }
</style>
