<template>
  <div class="column is-4 is-flex is-align-items-center is-justify-content-center">
    <div class="sz-2 mr-2 has-background-light rounded-corners">
      <div
        v-if="gameSlot.playerToMove === 'white'"
        class="sz-100 icon-king color-black"
      />
    </div>
    <p class="adjust-text is-break-word is-size-5 has-text-centered">
      {{ gameSlot.whiteDisplayName }}
    </p>
    <div
      class="pl-3 pr-2 py-2 is-clickable"
      @click="emit('user-clicked', gameSlot.whiteId)"
    >
      <div class="sz-icon icon-external-link color-primary-dark" />
    </div>
  </div>
  
  <div class="column is-1 py-0 is-flex is-align-items-center is-justify-content-center">
    vs.
  </div>
  
  <div class="column is-4 is-flex is-align-items-center is-justify-content-center">
    <div class="sz-2 mr-2 has-background-dark rounded-corners">
      <div
        v-if="gameSlot.playerToMove === 'black'"
        class="sz-100 icon-king color-white"
      />
    </div>
    <p class="adjust-text is-break-word is-size-5 has-text-centered">
      {{ gameSlot.blackDisplayName }}
    </p>
    <div
      class="pl-3 pr-2 py-2 is-clickable"
      @click="emit('user-clicked', gameSlot.blackId)"
    >
      <div class="sz-icon icon-external-link color-primary-dark" />
    </div>
  </div>
  
  <div class="column is-3 is-flex is-align-items-center">
    <button
      class="button is-fullwidth is-primary"
      @click="$router.push({ name: 'play-online', params: { gameId: gameSlot.gameId } })"
    >
      <div
        class="sz-icon color-white"
        :class="{
          'icon-knight': gameSlot.currentUserIsPlayer,
          'icon-eye': !gameSlot.currentUserIsPlayer,
        }"
      />
      {{ gameSlot.currentUserIsPlayer ? 'Resume' : 'Watch' }}
    </button>
  </div>
</template>

<script setup lang="ts">
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
