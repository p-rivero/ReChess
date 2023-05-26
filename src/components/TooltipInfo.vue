<template>
  <div
    class="tooltip-container"
    :data-tooltip="text"
  >
    <div class="sz-100 color-theme icon-help" />
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    text: string
  }>()
</script>

<style scoped>
  .tooltip-container {
    width: 1.5rem;
    height: 1.5rem;
    cursor: default;
  }
</style>