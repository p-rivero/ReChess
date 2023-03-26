<template>
  <div
    v-for="(piece, pieceIndex) of props.state.pieceTypes"
    :key="pieceIndex"
    class="piece-container mb-5"
  >
    <div v-if="editable">
      <button
        class="button sz-3 mr-4 my-1 px-2 fit-content"
        @click="emit('delete-click', pieceIndex)"
      >
        <div class="icon-trash color-theme" />
      </button>
    </div>
    <div
      class="box py-2 px-2 is-clickable"
      @click="emit('piece-click', pieceIndex)"
      @mouseenter="hovered = pieceIndex"
      @mouseleave="hovered = -1"
    >
      <div class="box-row">
        <div
          class="sz-2 ml-2 mr-4"
          :class="{
            'icon-edit': editable,
            'icon-info': !editable,
            'color-primary-dark': hovered === pieceIndex,
            'color-theme': hovered !== pieceIndex,
          }"
        />
        
        <PieceImageView
          :piece="piece"
          color="white"
          class="sz-3 mr-4"
        />
        
        <PieceImageView
          :piece="piece"
          color="black"
          class="sz-3 mr-4"
        />
        
        <p class="mr-4 py-2">
          {{ piece.displayName }}
        </p>
        
        <div
          v-if="piece.isLeader"
          class="is-flex is-align-items-center py-2"
        >
          <div class="star-icon-container icon-star-fill color-primary-dark mb-1 mr-1 is-flex-shrink-0" />
          <strong class="has-text-primary-dark mr-4">Leader</strong>
        </div>
      </div>
      <div
        v-if="piece.promoVals[0].length > 0"
        class="box-row mt-4"
      >
        <p class="is-size-7 mr-4">
          (White) Promote to:
        </p>
        <img
          v-for="(sym, i) of piece.promoVals[0].filter(sym => symbolImg(0, sym))"
          :key="i"
          :src="symbolImg(0, sym)"
          :alt="`${sym}`"
          class="sz-2 mr-4"
          draggable="false"
        >
      </div>
      <div
        v-if="piece.promoVals[1].length > 0"
        class="box-row mt-4"
      >
        <p class="is-size-7 mr-4">
          (Black) Promote to:
        </p>
        <img
          v-for="(sym, i) of piece.promoVals[1].filter(sym => symbolImg(1, sym))"
          :key="i"
          :src="symbolImg(1, sym)"
          :alt="`piece ${sym}`"
          class="sz-2 mr-4"
          draggable="false"
        >
      </div>
    </div>
  </div>
  <button
    v-if="editable"
    class="button"
    @click="emit('new-click')"
  >
    <div class="sz-icon icon-add color-theme" />
    <span>Add piece</span>
  </button>
</template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/types'
  import { ref } from 'vue'
  import PieceImageView from '@/components/Variant/PieceImageView.vue'
  
  const hovered = ref(-1)
  const props = defineProps<{
    editable: boolean
    state: GameState
  }>()
  
  const emit = defineEmits<{
    (event: 'piece-click', pieceIndex: number): void
    (event: 'delete-click', pieceIndex: number): void
    (event: 'new-click'): void
  }>()
  
  function symbolImg(player: 0|1, symbol: string): string {
    for (const piece of props.state.pieceTypes) {
      if (piece.ids[player] === symbol) {
        return piece.imageUrls[player] ?? ''
      }
    }
    return ''
  }
  
</script>

<style scoped lang="scss">
  .piece-container {
    display: flex;
    align-items: center;
  }
  
  .star-icon-container {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  
  .box-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
  .box p {
    overflow-wrap: anywhere;
  }
</style>
