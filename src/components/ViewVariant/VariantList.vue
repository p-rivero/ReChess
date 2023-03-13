<template>
  <div class="field is-grouped is-grouped-multiline is-align-items-center">
    <VariantCard v-for="(state, index) of variantStore.variantList" :variant="state" :key="index" />
  </div>
</template>

<script setup lang="ts">
  import { useVariantStore } from '@/stores/variant'
  import VariantCard from '@/components/ViewVariant/VariantCard.vue'
  
  const variantStore = useVariantStore()
  
  variantStore.refreshList()
</script>

<style scoped lang="scss">
  .field {
    justify-content: center;
  }
</style>