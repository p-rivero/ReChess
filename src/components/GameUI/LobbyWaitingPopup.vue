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
        <div class="mb-4 is-flex">
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
        <p>We'll let you know when someone wants to join your game.</p>
      </section>
      <footer class="modal-card-foot is-flex">
        <button
          class="button"
          @click="cancel"
        >
          <div class="sz-icon icon-cross color-theme" />
          Cancel
        </button>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import type { RequestedColor } from '@/firebase/db/schema'
  import { ref } from 'vue'
  
  const popup = ref<HTMLElement>()
  const autofocusButton = ref<HTMLButtonElement>()
  const color = ref<RequestedColor>('random')
  
  defineExpose({
    show(requestedColor: RequestedColor) {
      color.value = requestedColor
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      autofocusButton.value?.focus()
    },
    hide: closePopup,
  })
  
  const emit = defineEmits<{
    (event: 'cancel'): void
  }>()
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
  function cancel() {
    emit('cancel')
    closePopup()
  }
  
  
  function capitalizeColor(color: RequestedColor) {
    switch (color) {
    case 'white': return 'as White'
    case 'black': return 'as Black'
    case 'random': return 'a random color'
    }
  }
  
</script>

<style scoped lang="scss">
  .modal-card {
    max-width: 40rem;
  }
</style>
