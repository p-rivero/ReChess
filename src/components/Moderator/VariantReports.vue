<template>
  <GenericUserReports
    :reports="variantReports.reports"
    :discard-reports="discardReports"
  >
    TODO
  </GenericUserReports>
</template>


<script setup lang="ts">
  import { type VariantReports, useModeratorStore } from '@/stores/moderator'
  import { computed } from 'vue'
  import GenericUserReports from './GenericReports.vue'
  
  const moderatorStore = useModeratorStore()
  
  const props = defineProps<{
    variantReports: VariantReports
  }>()
  
  const variant = computed(() => props.variantReports.reportedVariant)
  
  async function discardReports(indexes: Set<number>) {
    const variantId = variant.value.uid
    await moderatorStore.discardVariantReports(variantId, indexes)
  }
</script>
