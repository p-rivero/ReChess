<template>
  <div>
    <MoveHistoryView
      :key="updateKey"
      ref="listElement"
      class="py-3 history-bg scrollable"
      :root="root"
      :start-at-left="true"
      :root-move-number="1"
      :indent-depth="0"
      :current-selection="currentSelection"
      @node-clicked="node => emit('node-clicked', node)"
    />
    
    <div class="is-flex">
      <button
        class="button is-small is-fullwidth mx-1 borderless"
        @click="emit('node-clicked', root)"
      >
        <div class="sz-icon icon-chevron-left-2 color-theme" />
      </button>
      <button
        class="button is-small is-fullwidth mx-1 borderless"
        @click="emit('scroll', true)"
      >
        <div class="sz-icon icon-chevron-left color-theme" />
      </button>
      <button
        class="button is-small is-fullwidth mx-1 borderless"
        @click="emit('scroll', false)"
      >
        <div class="sz-icon icon-chevron-right color-theme" />
      </button>
      <button
        class="button is-small is-fullwidth mx-1 borderless"
        @click="emit('node-clicked', findLastMainNode(root))"
      >
        <div class="sz-icon icon-chevron-right-2 color-theme" />
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { isScrolledIntoView, pageIsScrollable } from '@/helpers/web-utils'
  import { onMounted, ref, watch } from 'vue'
  import MoveHistoryView from './MoveHistoryView.vue'
  import type { MoveTreeNode } from '@/helpers/managers/move-history-manager'
  
  const updateKey = ref(0)
  const listElement = ref<InstanceType<typeof MoveHistoryView>>()
  
  const props = defineProps<{
    root: MoveTreeNode
    currentSelection?: MoveTreeNode
  }>()
  
  const emit = defineEmits<{
    (event: 'node-clicked', node: MoveTreeNode): void
    (event: 'scroll', up: boolean): void
  }>()
  
  watch(props, updateHistory)
  onMounted(updateHistory)
  function updateHistory() {
    if (!listElement.value) return
    const elem = listElement.value.$el as HTMLElement
    const scrollPos = elem.scrollTop
    updateKey.value++
    
    // Preserve scroll position (if fully visible)
    requestAnimationFrame(() => {
      const elem = listElement.value?.$el as HTMLElement
      elem.scrollTop = scrollPos
      if (!isScrolledIntoView(elem)) return
      // Make sure the move with class 'highlight-move' is visible
      const highlightedMove = elem.querySelector('.highlight-move')
      const verticalStrategy = pageIsScrollable() ? 'nearest' : 'center'
      highlightedMove?.scrollIntoView({ behavior: 'smooth', block: verticalStrategy })
    })
  }
  
  function findLastMainNode(node: MoveTreeNode): MoveTreeNode {
    while (node.children.length > 0) {
      node = node.children[0]
    }
    return node
  }
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
    height: calc(100% - 2rem);
  }
</style>
