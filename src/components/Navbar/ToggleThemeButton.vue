<template>
  <button
    class="button toggle-theme-button icon-night color-night"
    :key="themeStore.currentTheme"
    @click="themeStore.toggle"
  >
  </button>
</template>


<script setup lang="ts">
  import { useThemeStore } from '@/stores/theme';
  const themeStore = useThemeStore();
</script>

<style scoped>
  .toggle-theme-button {
    height: 2rem;
    width: 2rem;
    border: none;
    background-color: transparent;
  }
</style>