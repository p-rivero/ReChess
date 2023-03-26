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
    v-else
    class="icon-cross color-black"
  />
</template>


<script setup lang="ts">
  import type { PieceDefinition, Player } from '@/protochess/types'
  import { computed } from 'vue'
  
  const props = defineProps<{
    piece: PieceDefinition
    color: Player
  }>()
  
  const index = computed(() => props.color === 'white' ? 0 : 1)
  
  const type = computed(() => {
    if (props.piece.imageUrls[index.value]) {
      return 'image'
    }
    if (props.piece.ids[index.value]) {
      return 'text'
    }
    return 'none'
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
