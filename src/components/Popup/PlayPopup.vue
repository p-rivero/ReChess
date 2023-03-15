<template>
  <div class="modal" ref="popup">
    <div class="modal-background" @click="closePopup"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Play</p>
        <button class="delete is-large" aria-label="close" @click="closePopup"></button>
      </header>
      <footer class="modal-card-foot is-flex is-justify-content-center">
        <div class="columns w-100">
          <div class="column is-clickable" @click="play('white')">
            <button aria-label="play as white" class="button px-0 py-0 mr-0 is-white">
              <span class="icon-king color-black"></span>
            </button>
            <p>As White</p>
          </div>
          <div class="column is-clickable" @click="play('random')">
            <button aria-label="play as random side" class="button random-side px-0 py-0 mr-0"></button>
            <p>Random side</p>
          </div>
          <div class="column is-clickable" @click="play('black')">
            <button aria-label="play as black" class="button px-0 py-0 mr-0 is-black">
              <span class="icon-king color-white"></span>
            </button>
            <p>As Black</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const popup = ref<HTMLElement>()
  const buttonRandom = ref<HTMLButtonElement>()
  // Undefined when playing the stored variant draft
  let variantId: string | undefined
  
  defineExpose({
    show(id?: string) {
      variantId = id
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
    // Go to play page
    router.push({ name: 'play', params: { variantId: variantId }, query: { startAs: side } })
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
