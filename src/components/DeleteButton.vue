<template>
  <button class="button delete-button" :class="{'dark-theme': themeStore.currentTheme === 'dark'}"></button>
</template>

<script setup lang="ts">
  import { useThemeStore } from '@/stores/theme';
  const themeStore = useThemeStore();
</script>

<style scoped lang="scss">
  .delete-button {
    margin-left: 0rem;
    margin-right: 1rem;
    width: 2rem;
    height: 2rem;
    background-color: transparent;
    border: none;
    background-image: url("@/assets/img/trash/trash-light.svg");
    background-size: contain;
  }
  .delete-button.dark-theme {
    background-image: url("@/assets/img/trash/trash-dark.svg");
  }
</style>
