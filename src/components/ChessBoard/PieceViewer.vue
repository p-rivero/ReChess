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
  import type { PieceDefinition } from '@/protochess/interfaces';
  import type { Config } from 'chessgroundx/config';
  import ChessgroundAdapter from './internal/ChessgroundAdapter.vue';
  
  const props = defineProps<{
    size: number
    piece: PieceDefinition
  }>()
  
  const image = props.piece.imageUrls[0] || props.piece.imageUrls[1]
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

