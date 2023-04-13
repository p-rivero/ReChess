<template>
  <div
    ref="popup"
    class="modal"
  >
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title is-flex-shrink-1">
          Waiting for opponent...
        </p>
        <button
          ref="autofocusButton"
          class="delete is-large"
          aria-label="close"
          @click="cancel"
        />
      </header>
      
      <section class="modal-card-body">
        <div class="mb-5 is-flex w-100 is-justify-content-center">
          <div
            v-if="color === 'random'"
            class="sz-icon icon-dice color-theme"
          />
          <div
            v-else
            class="sz-icon icon-king-big color-theme"
          />
          <p class="adjust-text">
            You will play <strong>{{ capitalizeColor(color) }}</strong>
          </p>
        </div>
        
        <div
          v-if="challenger"
          class="w-100 is-flex is-align-items-center is-justify-content-center"
        >
          <img
            v-if="challenger.image"
            class="sz-3 mr-2 image is-rounded"
            :src="challenger.image"
            draggable="false"
            alt="Profile image"
          >
          <div
            v-else
            class="sz-3 mr-2 icon-user color-theme is-flex-shrink-0"
          />
          
          <p class="is-size-4 is-break-word">
            <strong>{{ challenger.name }}</strong> wants to join
          </p>
        </div>
        <p
          v-else
          class="w-100 has-text-centered"
        >
          We'll let you know when someone wants to join your game.
        </p>
      </section>
      
      
      <footer class="modal-card-foot is-flex">
        <button
          v-if="!challenger"
          class="button"
          @click="cancel"
        >
          <div class="sz-icon icon-cross color-theme" />
          Cancel
        </button>
        
        <button
          v-if="challenger"
          class="button"
          @click="emit('reject-challenger')"
        >
          <div class="sz-icon icon-cross color-theme" />
          Reject
        </button>
        
        <button
          v-if="challenger"
          class="button is-primary"
          @click="acceptChallenger"
        >
          <div class="sz-icon icon-check color-white" />
          Start game
        </button>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import type { RequestedColor } from '@/firebase/db/schema'
  import type { ChallengerInfo } from '@/stores/lobby'
  import { ref } from 'vue'
  
  const popup = ref<HTMLElement>()
  const autofocusButton = ref<HTMLButtonElement>()
  const color = ref<RequestedColor>('random')
  const challenger = ref<ChallengerInfo>()
  
  defineExpose({
    show(requestedColor: RequestedColor) {
      color.value = requestedColor
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      autofocusButton.value?.focus()
    },
    challengerJoined(info: ChallengerInfo) {
      challenger.value = info
    },
    challengerLeft() {
      challenger.value = undefined
    },
    hide: closePopup,
  })
  
  const emit = defineEmits<{
    (event: 'cancel'): void
    (event: 'accept-challenger', id: string): void
    (event: 'reject-challenger'): void
  }>()
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
  function cancel() {
    emit('cancel')
    closePopup()
  }
  
  function acceptChallenger() {
    if (challenger.value) {
      emit('accept-challenger', challenger.value.id)
      closePopup()
    }
  }
  
  
  function capitalizeColor(color: RequestedColor) {
    switch (color) {
    case 'white': return 'as White'
    case 'black': return 'as Black'
    case 'random': return 'a random side'
    }
  }
  
</script>

<style scoped lang="scss">
  .modal-card {
    max-width: 40rem;
  }
</style>
