<template>
  <div class="card px-2 py-2 mx-3 my-4">
    <div
      class="is-clickable"
      @click="$router.push({ name: 'variant-details', params: { variantId: id } })"
    >
      <ViewableChessBoard
        ref="board"
        max-height="20rem"
        :white-pov="true"
        :view-only="true"
        :show-coordinates="false"
        :capture-wheel-events="false"
      />
      <p class="mt-3 is-size-5 has-text-weight-semibold">
        <HighlightWords
          :search-words="[/* Not used */]"
          :text-to-highlight="name"
          highlight-class-name="has-text-primary-dark"
          :find-chunks="() => matches"
        />
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
  import type { Match } from '@/utils/chess/variant-search'
  import { onMounted, ref } from 'vue'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import HighlightWords from 'vue-highlight-words'
  import type { Variant } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  defineProps<{
    id: string,
    name: string,
    matches: Match[]
  }>()
  
  
  onMounted(async () => {
    const DUMMY_VARIANT: Variant = {
      boardWidth: 8,
      boardHeight: 8,
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      playerToMove: 0,
      pieceTypes: [],
      globalRules: {
        capturingIsForced: false,
        checkIsForbidden: false,
        stalematedPlayerLoses: false,
        invertWinConditions: false,
        repetitionsDraw: 0,
        checksToLose: 0,
      },
      displayName: '',
      description: '',
    }
    board.value?.setState(DUMMY_VARIANT)
  })
    
</script>

<style scoped lang="scss">
  .card {
    width: 17rem;
  }
</style>
