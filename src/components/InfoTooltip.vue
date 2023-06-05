<template>
  <div
    ref="tooltipContainer"
    class="tooltip-container is-flex-shrink-0"
  >
    <div class="sz-100 color-theme icon-help" />
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import tippy, { type Instance } from 'tippy.js'
  
  const tooltipContainer = ref<HTMLDivElement>()
  let tippyInstance: Instance | null = null

  const props = defineProps<{
    text: string
  }>()
  
  onMounted(() => {
    if (!tooltipContainer.value) {
      throw new Error('Tooltip container not found')
    }
    tippyInstance = tippy(tooltipContainer.value, {
      content: props.text,
      animation: 'shift-away-subtle',
    })
  })
  
  onBeforeUnmount(() => {
    tippyInstance?.destroy()
  })
  
</script>

<style scoped>
  .tooltip-container {
    width: 1.5rem;
    height: 1.5rem;
    cursor: default;
  }
</style>
