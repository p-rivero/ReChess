<template>
  <div class="modal" ref="popup">
    <!-- <div class="modal-background" @click="closePopup"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ titleText }}</p>
        <button class="delete is-large" aria-label="close" @click="cancel"></button>
      </header>
      <section class="modal-card-body">
        {{ messageText }}
      </section>
      <footer class="modal-card-foot">
        <button ref="primaryButton" class="button is-primary" @click="accept" @keydown.esc="cancel">{{ primaryButtonText }}</button>
        <button v-if="secondaryButtonText" class="button" @click="cancel" @keydown.esc="cancel">{{ secondaryButtonText }}</button>
      </footer>
    </div> -->
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  
  const popup = ref<HTMLElement>()
  const buttonRandom = ref<HTMLButtonElement>()
  
  defineExpose({
    show() {
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      buttonRandom.value?.focus()
    },
    hide: closePopup,
  })
  
  function accept() {
    closePopup()
  }
  function cancel() {
    closePopup()
  }
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
</script>
