<template>
  <button
    v-bind:class="{
      'button': true,
      'toggle-theme-button': true,
      'dark-theme': themeStore.currentTheme === 'dark',
    }"
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
    background-image: url("@/assets/img/themes/moon.svg");
  }
  .dark-theme {
    background-image: url("@/assets/img/themes/sun.svg");
  }
</style>