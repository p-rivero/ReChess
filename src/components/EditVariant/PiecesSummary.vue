<template>
  <div v-for="(piece, pieceIndex) in props.state.pieceTypes" class="piece-container mb-4" :key="pieceIndex">
    <div v-if="editable">
      <button class="button icon-edit color-theme transparent-button mr-4" @click="emit('edit-click', pieceIndex)"></button>
      <button class="button icon-trash color-theme transparent-button mr-4" @click="emit('delete-click', pieceIndex)"></button>
    </div>
    <div class="box">
      <img v-if="piece.ids[0] != null && piece.imageUrls[0]" :src="piece.imageUrls[0]" alt="piece image" class="piece-image mr-4">
      <div v-else alt="piece image" class="piece-image mr-4 icon-cross" :class="{'color-theme': piece.ids[0] != null}"></div>
      
      <img v-if="piece.ids[1] != null && piece.imageUrls[1]" :src="piece.imageUrls[1]" alt="piece image" class="piece-image mr-4">
      <div v-else alt="piece image" class="piece-image mr-4 icon-cross" :class="{'color-theme': piece.ids[1] != null}"></div>
      
      <p class="mr-4">{{ piece.displayName }}</p>
      
      <div v-if="piece.isLeader" class="star-icon-container icon-star color-primary-dark mb-1 mr-1"></div>
      <strong v-if="piece.isLeader" class="has-text-primary-dark mr-4">Leader</strong>
    </div>
  </div>
  <br>
  <button class="button" @click="emit('new-click')">
    <span class="icon">
      <div class="icon-add color-theme icon"></div>
    </span>
    <span>Add piece</span>
  </button>
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces'
  
  const props = defineProps<{
    editable: boolean
    state: GameState
  }>()
  
  const emit = defineEmits<{
    (event: 'edit-click', pieceIndex: number): void
    (event: 'delete-click', pieceIndex: number): void
    (event: 'new-click'): void
  }>()
  
</script>

<style scoped lang="scss">
  .piece-container {
    display: flex;
    align-items: center;
  }
  
  .piece-image {
    width: 3rem;
    height: 3rem;
    background-size: contain;
    display: inline-block;
  }
  
  .transparent-button {
    width: 2rem;
    height: 2rem;
  }
  
  .star-icon-container {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  
  .box {
    padding: 0.5rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: fit-content;
    max-width: 80%;
  }
  .box p {
    overflow-wrap: anywhere;
  }
</style>
