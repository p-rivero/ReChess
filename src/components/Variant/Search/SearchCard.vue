<!--
  When this component is shown, it displays a placeholder and fetches the variant data in the background.
  When the data is fetched, it replaces the placeholder with the actual variant card.
 -->

<template>
  <VariantCard
    v-if="loadedVariant"
    :variant="loadedVariant"
  />
  <SearchCardPlaceholder
    v-else
    :search-result="searchResult"
  />
</template>

<script setup lang="ts">
  import type { VariantIndexResult } from '@/utils/chess/variant-search'
  import { onMounted, ref } from 'vue'
  import SearchCardPlaceholder from './SearchCardPlaceholder.vue'
  import VariantCard from '../View/VariantCard.vue'
  import type { PublishedVariantGui } from '@/protochess/types'
  import { useVariantStore } from '@/stores/variant'
  
  const props = defineProps<{
    searchResult: VariantIndexResult
  }>()
  
  const variantStore = useVariantStore()
  const loadedVariant = ref<PublishedVariantGui>()
  
  onMounted(async () => {
    // Fetch the variant data
    const variant = await variantStore.getVariant(props.searchResult.id)
    if (!variant) {
      console.error('Could not load variant', props.searchResult.id)
      return
    }
    loadedVariant.value = variant
  })
    
</script>
