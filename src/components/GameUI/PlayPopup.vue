<template>
  <div
    ref="popup"
    class="modal"
  >
    <div
      class="modal-background"
      @click="closePopup"
    />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          Play
        </p>
        <button
          class="delete is-large"
          aria-label="close"
          @click="closePopup"
        />
      </header>
      <footer class="modal-card-foot is-flex is-justify-content-center">
        <div class="columns is-mobile w-100 px-2">
          <div
            class="column is-clickable"
            @click="play('white')"
          >
            <button
              aria-label="play as white"
              class="button px-0 py-0 mr-0 is-white"
            >
              <span class="icon-king color-black" />
            </button>
            <p class="has-text-centered">
              As White
            </p>
          </div>
          <div
            class="column is-clickable"
            @click="play('random')"
          >
            <button
              aria-label="play as random side"
              class="button random-side px-0 py-0 mr-0"
            />
            <p class="has-text-centered">
              Random side
            </p>
          </div>
          <div
            class="column is-clickable"
            @click="play('black')"
          >
            <button
              aria-label="play as black"
              class="button px-0 py-0 mr-0 is-black"
            >
              <span class="icon-king color-white" />
            </button>
            <p class="has-text-centered">
              As Black
            </p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  
  type OnSelectCallback = (side: 'white' | 'black' | 'random') => void
  
  const popup = ref<HTMLElement>()
  const buttonRandom = ref<HTMLButtonElement>()
  // Undefined when playing the stored variant draft
  let onSelect: OnSelectCallback
  
  defineExpose({
    show(callback: OnSelectCallback) {
      onSelect = callback
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      buttonRandom.value?.focus()
    },
    hide: closePopup,
  })
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
  function play(side: 'white' | 'black' | 'random') {
    closePopup()
    onSelect?.(side)
  }
  
</script>

<style scoped lang="scss">
  .modal-card {
    max-width: 30rem;
  }
  footer button {
    width: 4rem;
    height: 4rem;
    &.random-side {
      background-image: url('@/assets/img/pieces/king-half.svg');
      background-size: cover;
    }
  }

  .column {
    // Center the content of the column
    display: flex;
    flex-direction: column;
    align-items: center;
    p {
      margin-top: 0.75rem;
      justify-content: center;
    }
  }
</style>
