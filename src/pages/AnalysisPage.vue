<template>
  <PlayableChessBoard ref='board' :size=1000 :white="'human'" :black="'human'" />
</template>

<script setup lang="ts">
  import {ref, onMounted} from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const draftStore = useVariantDraftStore()
  
  onMounted(() => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    board.value.setState(draftStore.state)
  })
</script>

