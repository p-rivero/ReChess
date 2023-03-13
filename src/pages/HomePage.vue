<template>
  <div>
    <div class="field is-grouped is-grouped-multiline">
      <VariantCard v-for="(state, index) of variantStore.variantList" :state="state" :key="index" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useVariantStore } from '@/stores/variant'
  import VariantCard from '@/components/VariantCard.vue'
  
  const variantStore = useVariantStore()
  
  variantStore.refreshList()
</script>