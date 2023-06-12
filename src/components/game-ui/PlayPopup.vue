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
      <footer class="modal-card-foot px-0 is-align-items-center is-flex-direction-column">
        <div
          v-if="showLevelSelect"
          class="mb-5"
        >
          <p class="w-100 has-text-centered mb-2">
            Engine strength:
          </p>
          <div class="is-flex is-justify-content-center">
            <button
              v-for="level of [1, 2, 3, 4, 5]"
              :key="level"
              class="button is-rounded"
              :class="{ 'is-primary': selectedLevel === level }"
              @click="selectedLevel = level; userPrefs.engineLevel = level"
            >
              {{ level }}
            </button>
          </div>
        </div>
        <div class="columns is-mobile w-100 px-2">
          <div
            class="column side-select"
            @click="play('white')"
          >
            <button
              ref="buttonWhite"
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
            class="column side-select"
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
            class="column side-select"
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
  import { useUserPrefsStore } from '@/stores/user-preferences'
  import type { RequestedColor } from '@/firebase/db/schema'
  
  type OnSelectCallback = (side: RequestedColor) => void
  type OnLevelSelectCallback = (side: RequestedColor, level: number) => void
  
  const userPrefs = useUserPrefsStore()
  const popup = ref<HTMLElement>()
  const buttonWhite = ref<HTMLButtonElement>()
  const showLevelSelect = ref(false)
  const selectedLevel = ref<number>(-1)
  // Undefined when playing the stored variant draft
  let onSelect: OnLevelSelectCallback
  
  defineExpose({
    show(callback: OnSelectCallback) {
      initPopup(callback)
      showLevelSelect.value = false
    },
    showWithLevels(callback: OnLevelSelectCallback) {
      initPopup(callback)
      showLevelSelect.value = true
      selectedLevel.value = userPrefs.engineLevel
    },
    hide: closePopup,
  })
  
  function initPopup(callback: OnLevelSelectCallback) {
    onSelect = callback
    popup.value?.classList.add('is-active')
    document.documentElement.classList.add('is-clipped')
    buttonWhite.value?.focus()
  }
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
  function play(side: RequestedColor) {
    closePopup()
    onSelect?.(side, selectedLevel.value)
  }
  
</script>

<style scoped lang="scss">
  .modal-card {
    max-width: 30rem;
  }

  .column.side-select {
    // Center the content of the column
    display: flex;
    flex-direction: column;
    align-items: center;
    p {
      margin-top: 0.75rem;
      justify-content: center;
    }
    button {
      width: 4rem;
      height: 4rem;
      &.random-side {
        background-image: url('@/assets/pieces/king-half.svg');
        background-size: cover;
      }
    }
      
    cursor: pointer;
    &:hover {
      background-color: rgba($color: #888, $alpha: 0.3);
    }
    border-radius: 0.25rem;
  }
</style>
