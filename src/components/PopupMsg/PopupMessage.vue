<template>
  <div
    ref="popup"
    class="modal"
  >
    <div
      class="modal-background"
      @click="backgroundClick"
    />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ titleText }}
        </p>
        <button
          class="delete is-large"
          aria-label="close"
          @click="cancel"
        />
      </header>
      <section class="modal-card-body content mb-0">
        <VueMarkdown :source="messageText" />
      </section>
      <footer class="modal-card-foot">
        <button
          ref="primaryButton"
          class="button is-primary"
          @click="accept"
          @keydown.esc="cancel"
        >
          {{ primaryButtonText }}
        </button>
        <button
          v-if="secondaryButtonText"
          class="button"
          @click="cancel"
          @keydown.esc="cancel"
        >
          {{ secondaryButtonText }}
        </button>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  import VueMarkdown from 'vue-markdown-render'
  
  const popup = ref<HTMLElement>()
  const titleText = ref('')
  const messageText = ref('')
  const primaryButton = ref<HTMLButtonElement>()
  const primaryButtonText = ref('')
  const secondaryButtonText = ref<string|null>(null)
  
  let acceptCallback: () => void
  let cancelCallback: () => void
  let isImportant = false
  
  defineExpose({
    show(important: boolean, title: string, message: string, buttons: 'ok' | 'ok-cancel' | 'yes-no', accept?: () => void, cancel?: () => void) {
      titleText.value = title
      messageText.value = message
      isImportant = important
      acceptCallback = accept ?? (() => { /* No callback set, do nothing */ })
      cancelCallback = cancel ?? (() => { /* No callback set, do nothing */ })
      if (buttons === 'ok-cancel') {
        primaryButtonText.value = 'OK'
        secondaryButtonText.value = 'Cancel'
      } else if (buttons === 'yes-no') {
        primaryButtonText.value = 'Yes'
        secondaryButtonText.value = 'No'
      } else if (buttons === 'ok') {
        primaryButtonText.value = 'OK'
        secondaryButtonText.value = null
      } else {
        throw new Error('Invalid button type')
      }
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      primaryButton.value?.focus()
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
  
  function backgroundClick() {
    if (!isImportant) {
      cancel()
    }
  }
  function closePopup() {
    isImportant = false
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
</script>

<style scoped lang="scss">
  .modal-card-title {
    flex-shrink: 1;
  }
</style>
