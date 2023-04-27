<template>
  <MoveHistoryView
    :key="updateKey"
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
