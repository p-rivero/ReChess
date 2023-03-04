<template>
  <button
    class="button toggle-theme-button icon-theme color-theme"
    @click="toggleTheme"
  >
  </button>
</template>


<script setup lang="ts">
  import { toggleTheme } from '@/utils/theme';
</script>

<style scoped>
  .toggle-theme-button {
    height: 2rem;
    width: 2rem;
  }
</style>
