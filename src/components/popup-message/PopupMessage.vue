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
        <slot />
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
  
  export type PopupCallback = () => Promise<void> | void
  export type PopupButtons = 'ok' | 'ok-cancel' | 'yes-no'
  
  let acceptCallback: PopupCallback
  let cancelCallback: PopupCallback
  let isImportant = false
  
  defineExpose({
    show(
      important: boolean,
      title: string,
      message: string,
      buttons: PopupButtons,
      accept: PopupCallback = (() => { /* Do nothing */ }),
      cancel: PopupCallback = (() => { /* Do nothing */ })
    ) {
      titleText.value = title
      messageText.value = message
      isImportant = important
      acceptCallback = accept
      cancelCallback = cancel
      initializeButtonText(buttons)
      
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      primaryButton.value?.focus()
    },
    hide: closePopup,
  })
  
  function initializeButtonText(buttons: PopupButtons) {
    switch (buttons) {
    case 'ok-cancel':
      primaryButtonText.value = 'OK'
      secondaryButtonText.value = 'Cancel'
      break
    case 'yes-no':
      primaryButtonText.value = 'Yes'
      secondaryButtonText.value = 'No'
      break
    case 'ok':
      primaryButtonText.value = 'OK'
      secondaryButtonText.value = null
      break
    default:
      throw new Error('Invalid button type')
    }
  }
  
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
