<template>
  <div class="card px-2 py-2 mx-3 my-4">
    <div
      class="is-clickable"
      @click="$router.push({ name: 'variant-details', params: { variantId: searchResult.id } })"
    >
      <ViewableChessBoard
        ref="board"
        :white-pov="true"
        :view-only="true"
        :show-coordinates="false"
        :capture-wheel-events="false"
      />
      <p class="mt-3 is-size-5 has-text-weight-semibold">
        {{ searchResult.name }}
      </p>
    </div>
    
    <p class="mb-0 has-text-weight-light">
      By <a>loading...</a>
    </p>
    <div class="columns is-mobile mb-0 mt-0">
      <div class="column is-narrow pr-0">
        <button
          aria-label="use as template"
          class="button button-square px-0"
          disabled
        >
          <div class="icon-edit color-theme" />
        </button>
      </div>
      <div class="column">
        <button
          class="button is-fullwidth"
          disabled
        >
          <div class="sz-icon icon-knight color-theme" />
          Play
        </button>
      </div>
    </div>
    <div class="is-flex align-items-center">
      <div class="is-flex-grow-1" />
      <button
        class="pr-2 button"
        disabled
      >
        <p class="mr-3">
          Loading...
        </p>
        <div class="sz-icon color-theme icon-heart" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { VariantIndexResult } from '@/utils/chess/variant-search'
  import { onMounted, ref } from 'vue'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import type { GameStateGui } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  defineProps<{
    searchResult: VariantIndexResult
  }>()
  
  
  onMounted(async () => {
    const DUMMY_STATE: GameStateGui = {
      boardWidth: 8,
      boardHeight: 8,
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      playerToMove: 0,
      inCheck: false,
      pieceTypes: [],
      pieces: [],
      invalidSquares: [],
      globalRules: {
        capturingIsForced: false,
        checkIsForbidden: false,
        stalematedPlayerLoses: false,
        invertWinConditions: false,
        repetitionsDraw: 0,
        checksToLose: 0,
      },
    }
    board.value?.setState(DUMMY_STATE)
  })
    
</script>

<style scoped lang="scss">
  .card {
    width: 17rem;
  }
</style>
