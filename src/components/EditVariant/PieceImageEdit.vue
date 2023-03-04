<template>
  <button class="button mr-4 px-1 py-1 fit-content">
    <img v-if="imageUrl" class="piece-image" alt="White piece" :src="imageUrl" />
    <div v-else class="piece-image">
      <div class="icon-cross color-black"></div>
    </div>
    <div class="icon-edit color-theme sz-2"></div>
  </button>
</template>

<script setup lang="ts">
  import { toRefs } from "vue";
  const props = defineProps<{
    imageUrl: string|null|undefined
  }>()
  const {imageUrl} = toRefs(props);
  
</script>

<style scoped>
  .piece-image {
    width: 4rem;
    height: 4rem;
    flex-shrink: 0;
    background-color: #b58863;
    border-radius: 0.25rem;
  }
  
  .fit-content {
    height: fit-content;
  }
</style>
