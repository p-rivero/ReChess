<template>
  <PlayableChessBoard ref='board' :size=1000 :white="'human'" :black="'human'" />
  <p> Board evaluation: {{ evaluation }} </p>
</template>

<script setup lang="ts">
  import {ref, onMounted} from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { getProtochess } from '@/protochess/protochess'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const draftStore = useVariantDraftStore()
  
  const evaluation = ref<string>('')
  
  onMounted(async () => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    board.value.setState(draftStore.state)
    const protochess = await getProtochess()
    board.value.onMoveCallback(async () => {
      const mv = await protochess.getBestMoveTimeout(2);
      evaluation.value = `${mv.evaluation}, best move: ${mv.from} -> ${mv.to} (search depth: ${mv.depth}))`
    })
  })
</script>

