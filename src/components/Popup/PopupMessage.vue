<template>
  <div class="modal" ref="popup">
    <div class="modal-background" @click="cancel"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ titleText }}</p>
        <button class="delete is-large" aria-label="close" @click="cancel"></button>
      </header>
      <section class="modal-card-body">
        {{ messageText }}
      </section>
      <footer class="modal-card-foot">
        <button class="button is-primary" @click="accept">{{ primaryButtonText }}</button>
        <button v-if="secondaryButtonText" class="button" @click="cancel">{{ secondaryButtonText }}</button>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  
  const popup = ref<HTMLElement>()
  const titleText = ref<string>('')
  const messageText = ref<string>('')
  const primaryButtonText = ref<string>('')
  const secondaryButtonText = ref<string|null>('')
  
  let acceptCallback: () => void
  let cancelCallback: () => void
  
  defineExpose({
    show: (title: string, message: string, buttons: 'ok' | 'ok-cancel' | 'yes-no', accept?: () => void, cancel?: () => void) => {
      titleText.value = title
      messageText.value = message
      acceptCallback = accept ?? (() => {})
      cancelCallback = cancel ?? (() => {})
      if (buttons === 'ok-cancel') {
        primaryButtonText.value = 'OK'
        secondaryButtonText.value = 'Cancel'
      } else if (buttons === 'yes-no') {
        primaryButtonText.value = 'Yes'
        secondaryButtonText.value = 'No'
      } else {
        primaryButtonText.value = 'OK'
        secondaryButtonText.value = null
      }
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
    },
    hide: closePopup,
  })
  
  function accept() {
    acceptCallback()
    closePopup()
  }
  function cancel() {
    cancelCallback()
    closePopup()
  }
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
</script>
