<!--
  When this component is shown, it covers the entire screen with a semi-transparent black overlay at a given z-index.
  The user cannot interact with anything behind that z-index.
 -->
 
<template>
  <div
    class="overlay w-100 h-100"
    @click="emit('click')"
  />
</template>

<script setup lang="ts">
  
  defineProps<{
    zIndex: number
  }>()
  
  const emit = defineEmits<{
    (event: 'click'): void
  }>()
</script>

<style scoped lang="scss">
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: v-bind('zIndex')
  }
</style>
