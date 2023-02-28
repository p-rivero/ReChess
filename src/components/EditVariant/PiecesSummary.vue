<template>
  <div v-for="(piece, pieceIndex) in props.state.pieceTypes" class="piece-container" :key="pieceIndex">
    <div v-if="editable">
      <button class="button icon-edit color-theme transparent-button margin-right-1rem" @click="onEditClick(pieceIndex)"></button>
      <button class="button icon-trash color-theme transparent-button margin-right-1rem" @click="onDeleteClick(pieceIndex)"></button>
    </div>
    <div class="box">
      <img v-if="piece.imageUrls[0]" :src="piece.imageUrls[0]" alt="piece image" class="piece-image">
      <div v-else alt="piece image" class="piece-image icon-cross color-theme"></div>
      
      <img v-if="piece.imageUrls[1]" :src="piece.imageUrls[1]" alt="piece image" class="piece-image">
      <div v-else alt="piece image" class="piece-image icon-cross color-theme"></div>
      
      <p class="margin-right-1rem">{{ piece.displayName }}</p>
      
      <img v-if="piece.isLeader" class="star-icon" src="@/assets/img/star.svg" alt="star">
      <strong v-if="piece.isLeader" class="has-text-primary margin-right-1rem">Leader</strong>
    </div>
  </div>
  <br>
  <button class="button" @click="onNewClick">
    <span class="icon">
      <div class="icon-add color-black icon" alt="star"></div>
    </span>
    <span>Add piece</span>
  </button>
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces'
  
  const props = defineProps<{
    editable: boolean
    state: GameState
    onEditClick: (pieceIndex: number) => void
    onDeleteClick: (pieceIndex: number) => void
    onNewClick: () => void
  }>()
  
</script>

<style scoped lang="scss">
  .piece-container {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
  
  .piece-image {
    width: 3rem;
    height: 3rem;
    background-size: contain;
    display: inline-block;
    margin-right: 1rem;
  }
  
  .transparent-button {
    width: 2rem;
    height: 2rem;
    background-color: transparent;
    border: none;
    background-size: contain;
  }
  
  .margin-right-1rem {
    margin-right: 1rem;
  }
  .star-icon {
    width: 1.5rem;
    height: 1.5rem;
    margin-bottom: 0.3rem;
    margin-right: 0.2rem;
  }
  
  
  .box {
    padding: 0.5rem;
    display: flex;
    flex-direction: row;
    width: fit-content;
    align-items: center;
  }
</style>
