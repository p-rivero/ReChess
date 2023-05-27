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
          {{ piece?.displayName }}
        </p>
        <button
          class="delete is-large"
          aria-label="close"
          @click="closePopup"
        />
      </header>
      <section class="modal-card-body">
        <div>
          <PieceViewerWithZoom
            v-if="piece"
            ref="board"
            :key="pieceIndex"
            :piece="piece"
            :get-click-mode="getClickMode"
          />
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          ref="buttonClose"
          class="button is-primary"
          @click="closePopup"
          @keydown.esc="closePopup"
        >
          Close
        </button>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { computed, ref } from 'vue'
  import PieceViewerWithZoom from '@/components/chessboard/PieceViewerWithZoom.vue'
  import type { Variant } from '@/protochess/types'
  
  const popup = ref<HTMLElement>()
  const buttonClose = ref<HTMLButtonElement>()
  const board = ref<InstanceType<typeof PieceViewerWithZoom>>()
  
  const pieceIndex = ref(-1)
  const props = defineProps<{
    variant: Variant
    getClickMode?: (position: [number, number]) => 'add'|'remove'
  }>()
  
  const piece = computed(() => {
    if (pieceIndex.value < 0) return null
    return props.variant.pieceTypes[pieceIndex.value]
  })
  
  defineExpose({
    show(index: number) {
      pieceIndex.value = index
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
      buttonClose.value?.focus()
    },
    hide: closePopup,
  })
  
  function closePopup() {
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
  }
  
  
</script>

<style scoped lang="scss">
  .modal-card-title {
    flex-shrink: 1;
  }
  .modal-card {
    max-width: 30rem;
  }
</style>
