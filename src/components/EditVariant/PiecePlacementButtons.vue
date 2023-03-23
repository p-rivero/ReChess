<template>
  <div class="field is-grouped is-grouped-multiline">
    <div
      v-for="(piece, index) in pieceList"
      :key="index"
      class="control"
      :style="{zIndex}"
    >
      <img
        class="button sz-3 px-1 py-1"
        draggable="false"
        :src="piece.url"
        :alt="`Select ${piece.id}`"
        :class="{'is-primary': selectedId === piece.id}"
        @click="onPieceClick(piece.id)"
      >
    </div>
    <div class="control">
      <button
        class="button sz-3 px-2 py-2"
        :class="{'is-primary': selectedId === 'wall'}"
        :style="{zIndex}"
        @click="onPieceClick('wall')"
      >
        <span
          class="icon-block"
          :class="{
            'color-theme': selectedId !== 'wall',
            'color-white': selectedId === 'wall',
          }"
        />
      </button>
    </div>
    <div class="control">
      <button
        class="button sz-3 px-2 py-2"
        :class="{'is-primary': selectedId === 'delete'}"
        :style="{zIndex}"
        @click="onPieceClick('delete')"
      >
        <span
          class="icon-trash"
          :class="{
            'color-theme': selectedId !== 'delete',
            'color-white': selectedId === 'delete',
          }"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/types'
  import { ref } from 'vue'
  
  const selectedId = ref<string|'wall'|'delete'|'none'>('none')
    
  const props = defineProps<{
    state: GameState
    zIndex: number
  }>()
  
  const emit = defineEmits<{
    (event: 'piece-selected', piece: string|'wall'|'delete'): void
    (event: 'piece-deselected'): void
  }>()
  
  defineExpose({
    cancelPlacement() {
      selectedId.value = 'none'
      emit('piece-deselected')
    },
  })
  
  // Extract the id and url from the piece definition
  const pieceList = ref<{id: string, url: string}[]>([])
  // First all white pieces
  for (const piece of props.state.pieceTypes) {
    if (piece.ids[0] && piece.imageUrls[0]) {
      pieceList.value.push({
        id: piece.ids[0],
        url: piece.imageUrls[0],
      })
    }
  }
  // Then all black pieces
  for (const piece of props.state.pieceTypes) {
    if (piece.ids[1] && piece.imageUrls[1]) {
      pieceList.value.push({
        id: piece.ids[1],
        url: piece.imageUrls[1],
      })
    }
  }
  
  function onPieceClick(id: string|'wall'|'delete') {
    if (selectedId.value === id) {
      selectedId.value = 'none'
      emit('piece-deselected')
    } else {
      selectedId.value = id
      emit('piece-selected', id)
    }
  }
    
</script>
