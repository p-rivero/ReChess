<template>
  <ChessgroundAdapter
    :width=15
    :height=15
    :size=$props.size
    :white-pov=true
    :view-only=true
    :initial-config=boardConfig
    :piece-images="{white: [['P', image]], black: []}"
    
    ref="board"
  />
</template>


<script setup lang="ts">
  import type { Config } from 'chessgroundx/config'
  import ChessgroundAdapter from './internal/ChessgroundAdapter.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useRoute } from 'vue-router'
  import { paramToInt } from '@/utils/param-to-int'
  
  const route = useRoute()
  defineProps<{
    size: number
  }>()
  
  const variantDraftStore = useVariantDraftStore()
  const index = paramToInt(route.params.pieceIndex) || -1
  const piece = variantDraftStore.getPiece(index)
  if (!piece) {
    throw new Error('This piece does not exist')
  }
  const image = piece.imageUrls[0] || piece.imageUrls[1]
  if (!image) {
    throw new Error('Piece has no image')
  }
  
  const boardConfig: Config = {
    fen: '7P/////// w - - 0 1',
    viewOnly: true,
    disableContextMenu: true,
    blockTouchScroll: true,
    coordinates: false,
    dimensions: {
      width: 15, 
      height: 15,
    },
    drawable: {
      defaultSnapToValidMove: false,
    },
  }
</script>

