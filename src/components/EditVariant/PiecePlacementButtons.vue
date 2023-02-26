<template>
  <div class="field is-grouped is-grouped-multiline">
    <div v-for="(piece, index) in pieceList" :key="index" class="control">
      <img
        class="button piece-button"
        :src="piece.url"
        :class="{'is-primary': selectedIndex === index}"
        @click="onPieceClick(index)"/>
    </div>
    <div class="control">
      <button
        class="button piece-button delete-button"
        :class="{'is-primary': selectedIndex === 'delete'}"
        @click="onDeleteClick()">
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces'
  import { ref } from 'vue'
  
  const selectedIndex = ref<number|'delete'|'none'>('none')
    
  const props = defineProps<{
    state: GameState
  }>()
  
  // Extract the id and url from the piece definition
  let pieceList: {id: string, url: string}[] = []
  // First all white pieces
  for (const piece of props.state.pieceTypes) {
    if (piece.ids[0] && piece.imageUrls[0]) {
      pieceList.push({
        id: piece.ids[0],
        url: piece.imageUrls[0],
      })
    }
  }
  // Then all black pieces
  for (const piece of props.state.pieceTypes) {
    if (piece.ids[1] && piece.imageUrls[1]) {
      pieceList.push({
        id: piece.ids[1],
        url: piece.imageUrls[1],
      })
    }
  }
  
  function onPieceClick(index: number) {
    if (selectedIndex.value === index) {
      selectedIndex.value = 'none'
    } else {
      selectedIndex.value = index
    }
  }
  function onDeleteClick() {
    if (selectedIndex.value === 'delete') {
      selectedIndex.value = 'none'
    } else {
      selectedIndex.value = 'delete'
    }
  }
    
</script>

<style scoped lang="scss">
  .piece-button {
    width: 3rem;
    height: 3rem;
    padding: 0.2rem;
    background-size: contain;
  }
  .delete-button {
    background-image: url("@/assets/img/cross/cross-light.svg");
  }
  .delete-button.is-primary {
    background-image: url("@/assets/img/cross/cross-dark.svg");
  }
  
</style>