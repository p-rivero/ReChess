<template>
  <BoardWithGui ref="board" :white="'human'" :black="'engine'" :has-gauge="false" />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { ref, onMounted } from 'vue'
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
    
  const draftStore = useVariantDraftStore()
  
  onMounted(async () => {
    board.value?.setState(draftStore.state)
  })
</script>
