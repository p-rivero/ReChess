<template>
  <div v-for="(piece, pieceIndex) in props.state.pieceTypes" class="piece-container" :key="pieceIndex">
    <div v-if="editable">
      <EditButton @click="onEditClick(pieceIndex)" />
      <DeleteButton class="margin-right-1rem" @click="onDeleteClick(pieceIndex)" />
    </div>
    <div class="box">
      <img v-if="piece.imageUrls[0]" :src="piece.imageUrls[0]" alt="piece image" class="piece-image">
      <div v-else alt="piece image" class="piece-image-not-found" :class="{'is-light': theme.currentTheme === 'light'}"></div>
      
      <img v-if="piece.imageUrls[1]" :src="piece.imageUrls[1]" alt="piece image" class="piece-image">
      <div v-else alt="piece image" class="piece-image-not-found" :class="{'is-light': theme.currentTheme === 'light'}"></div>
      
      <p class="margin-right-1rem">{{ piece.displayName }}</p>
      
      <img v-if="piece.isLeader" class="star-icon" src="@/assets/img/star.svg" alt="star">
      <strong v-if="piece.isLeader" class="has-text-primary margin-right-1rem">Leader</strong>
    </div>
  </div>
  <br>
  <button class="button" @click="onNewClick">
    <span class="icon">
      <div class="add-icon" alt="star"></div>
    </span>
    <span>Add piece</span>
  </button>
</template>

<script setup lang="ts">
  import EditButton from '@/components/EditButton.vue'
  import DeleteButton from '../DeleteButton.vue'
  import type { GameState } from '@/protochess/interfaces'
  import { useThemeStore } from '@/stores/theme'
  
  const theme = useThemeStore();
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
  .piece-image-not-found {
    @extend .piece-image;
    background-image: url("@/assets/img/cross/cross-dark.svg");
  }
  .piece-image-not-found.is-light {
    @extend .piece-image;
    background-image: url("@/assets/img/cross/cross-light.svg");
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
  .add-icon {
    width: 1.5rem;
    height: 1.5rem;
    margin-bottom: 0.1rem;
    background-image: url("@/assets/img/plus/plus-light.svg");
  }
  
  
  .box {
    padding: 0.5rem;
    display: flex;
    flex-direction: row;
    width: fit-content;
    align-items: center;
  }
</style>
