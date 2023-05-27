<template>
  <div
    class="pl-3 pr-2 py-2 is-clickable"
    @click="emit('click')"
  >
    <div class="sz-icon icon-external-link color-primary-dark" />
  </div>
</template>

<script setup lang="ts">
  const emit = defineEmits<{
    (event: 'click'): void
  }>()
</script>
