<template>
  <div
    ref="popup"
    class="modal"
  >
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title is-flex-shrink-1">
          Requesting to join...
        </p>
        <button
          ref="autofocusButton"
          class="delete is-large"
          aria-label="close"
          @click="cancel"
        />
      </header>
      
      <section class="modal-card-body">
        <div class="is-flex w-100 is-justify-content-center">
          <p class="is-size-5 is-break-word has-text-centered">
            The game will start as soon as <strong>{{ creatorName }}</strong> accepts your request
          </p>
        </div>
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
  import { ref } from 'vue'
  
  const popup = ref<HTMLElement>()
  const creatorId = ref('')
  const creatorName = ref('')
  
  defineExpose({
    show(id: string, name: string) {
      creatorId.value = id
      creatorName.value = name
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
    },
    hide: closePopup,
  })
  
  const emit = defineEmits<{
    (event: 'cancel', id: string): void
  }>()
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
  function cancel() {
    closePopup()
    emit('cancel', creatorId.value)
  }
  
</script>

<style scoped lang="scss">
  .modal-card {
    max-width: 30rem;
  }
</style>
