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
  import { useRoute } from 'vue-router'
  import type { PieceDefinition } from '@/protochess/interfaces'
  
  const route = useRoute()
  const params = defineProps<{
    size: number
    piece: PieceDefinition|null
  }>()
  
  const image = params.piece?.imageUrls[0] || params.piece?.imageUrls[1] || ''
  
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

