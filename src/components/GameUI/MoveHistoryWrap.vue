<template>
  <MoveHistoryView
    :key="updateKey"
    class="py-3 history-bg scrollable"
    :root="root"
    :start-at-left="true"
    :root-move-number="1"
    :indent-depth="0"
    :current-selection="currentSelection"
    @node-clicked="node => emit('node-clicked', node)"
  />
</template>


<script setup lang="ts">
  import { ref, watch } from 'vue'
  import MoveHistoryView from './MoveHistoryView.vue'
  import type { MoveTreeNode } from '@/utils/chess/move-history-manager'
  
  const updateKey = ref(0)
  
  const props = defineProps<{
    root: MoveTreeNode
    currentSelection?: MoveTreeNode
  }>()
  
  const emit = defineEmits<{
    (event: 'node-clicked', node: MoveTreeNode): void
  }>()
  
  watch(props, () => {
    updateKey.value++
  })
</script>


<style scoped lang="scss">
  @import '@/assets/style/variables.scss';
  [data-theme="dark"] .history-bg {
    background-color: $black-bis;
  }
  [data-theme="light"] .history-bg {
    background-color: $white-bis
  }
  .history-bg {
    border-radius: 0.25rem;
    min-height: 10rem;
  }
</style>
