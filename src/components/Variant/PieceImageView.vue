<!--
  This component renders a given piece type + color into an image.
 -->
 
<template>
  <img
    v-if="type === 'image'"
    class="piece-image"
    :alt="props.piece.ids[index] ? `Piece ${props.piece.ids[index]}` : 'Piece image'"
    draggable="false"
    :src="props.piece.imageUrls[index] ?? ''"
  >
  <div
    v-else-if="type === 'text'"
    class="is-flex is-flex-center is-align-items-center is-justify-content-center"
  >
    <p class="is-size-4 has-text-weight-semibold">
      {{ props.piece.ids[index] }}
    </p>
  </div>
  <div
    v-else-if="type === 'cross'"
    class="icon-cross color-theme"
  />
  <div v-else />
</template>


<script setup lang="ts">
  import { computed } from 'vue'
  import type { FullPieceDef, Player } from '@/protochess/types'
  
  const props = defineProps<{
    piece: FullPieceDef
    color: Player
  }>()
  
  const index = computed(() => props.color === 'white' ? 0 : 1)
  
  const type = computed(() => {
    // An image is available, use it
    if (props.piece.imageUrls[index.value]) {
      return 'image'
    }
    // If symbol is null or undefined, the piece is not available for that color
    if (props.piece.ids[index.value] == null) {
      return 'none'
    }
    // The piece is available, but has no image and no symbol, show a cross
    if (!props.piece.ids[index.value]) {
      return 'cross'
    }
    // The piece has a symbol, show it
    return 'text'
  })
  
</script>

<style scoped lang="scss">
  .piece-image {
    width: 100%;
    height: 100%;
    // Mimic the same rendering as the chessboard
    object-fit: cover;
    object-position: left;
  }
</style>
