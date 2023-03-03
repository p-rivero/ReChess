<template>
  <div class="field is-grouped is-grouped-multiline">
    <div v-for="(piece, index) in pieceList" :key="index" class="control" :style="{zIndex}">
      <img
        class="button piece-button px-1 py-1"
        :src="piece.url"
        :class="{'is-primary': selectedId === piece.id}"
        @click="onPieceClick(piece.id)"/>
    </div>
    <div class="control">
      <button class="button piece-button px-2 py-2" :class="{'is-primary': selectedId === 'delete'}" :style="{zIndex}" @click="onDeleteClick()">
        <span class="icon-trash"
        :class="{
          'color-black': selectedId !== 'delete',
          'color-white': selectedId === 'delete',
        }"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces'
  import { ref } from 'vue'
  
  const selectedId = ref<string|'delete'|'none'>('none')
    
  const props = defineProps<{
    state: GameState
    zIndex: number
  }>()
  
  const emit = defineEmits<{
    (event: 'piece-selected', piece: string|'delete'): void
    (event: 'piece-deselected'): void
  }>()
  
  defineExpose({
    cancelPlacement: () => {
      selectedId.value = 'none'
      emit('piece-deselected')
    },
  })
  
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
  
  function onPieceClick(id: string) {
    if (selectedId.value === id) {
      selectedId.value = 'none'
      emit('piece-deselected')
    } else {
      selectedId.value = id
      emit('piece-selected', id)
    }
  }
  function onDeleteClick() {
    if (selectedId.value === 'delete') {
      selectedId.value = 'none'
      emit('piece-deselected')
    } else {
      selectedId.value = 'delete'
      emit('piece-selected', 'delete')
    }
  }
    
</script>

<style scoped lang="scss">
  .piece-button {
    width: 3rem;
    height: 3rem;
  }
</style>