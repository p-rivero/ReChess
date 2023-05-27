<!--
  When this component is shown, it displays a placeholder and fetches the variant data in the background.
  When the data is fetched, it replaces the placeholder with the actual variant card.
 -->

<template>
  <VariantCard
    v-if="loadedVariant"
    :variant="loadedVariant"
    :highlight-matches="matches"
    @tag-clicked="tag => emit('tag-clicked', tag)"
  />
  <SearchCardPlaceholder
    v-else
    :id="variantId"
    :name="variantName"
    :matches="matches"
  />
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { useVariantStore } from '@/stores/variant'
  import SearchCardPlaceholder from './SearchCardPlaceholder.vue'
  import VariantCard from '@/components/variant/view/VariantCard.vue'
  import type { Match, SearchOrder } from '@/helpers/chess/variant-search'
  import type { PublishedVariant } from '@/protochess/types'
  
  const props = defineProps<{
    variantId: string
    variantName: string
    matches: Match[]
    currentSearchScore: number // Updated search relevance score
    orderBy: SearchOrder
  }>()
  
  const emit = defineEmits<{
    (event: 'update-score', score: number): void
    (event: 'tag-clicked', tag: string): void
  }>()
  
  const variantStore = useVariantStore()
  const loadedVariant = ref<PublishedVariant>()
  
  onMounted(async () => {
    // Fetch the variant data
    const variant = await variantStore.getVariant(props.variantId)
    if (!variant) {
      console.error('Could not load variant', props.variantId)
      return
    }
    loadedVariant.value = variant
  })
  
  // When some of the following change: (variant has been loaded, search score, search order), update the score
  watch([props, loadedVariant], () => {
    // If the variant still has not been fetched from the server, we don't know its upvotes, creation time, etc.
    // so we don't know its position in the list (unless we are sorting by search relevance). Sort it temporarily
    // by relevance but give it a lower score so that it appears at the bottom of the list
    if (!loadedVariant.value) {
      const searchScore = props.currentSearchScore
      if (props.orderBy === 'search-relevance') emit('update-score', searchScore)
      else emit('update-score', searchScore - 1000)
      return
    }
    
    // More upvotes means a higher score. Use the search score as a tiebreaker
    const upvoteScore = loadedVariant.value.numUpvotes + 0.1 * props.currentSearchScore
    
    switch (props.orderBy) {
    case 'search-relevance':
      // Use the search score as the ordering score
      emit('update-score', props.currentSearchScore)
      break
    case 'popular': {
      // upvoteScore could be arbitrarily large, so we make it more reasonable by calculating
      // the log. If upvoteScore is 0, then ln(0) = -Inf. Add 1 to it so that ln(1) = 0.
      // Use the multiplier to control the weight of the upvoteScore in the popularity score
      // (vs. variant.popularity, which is the number of current players in this variant).
      const MULTIPLIER = 0.5
      emit('update-score', loadedVariant.value.popularity + Math.log(upvoteScore + 1) * MULTIPLIER)
      break
    }
    case 'upvotes':
      emit('update-score', upvoteScore)
      break
    case 'newest':
      // A newer variant has a greater timestamp (and thus a higher score)
      emit('update-score', loadedVariant.value.creationTime.getTime())
      break
    default:
      throw new Error('Unknown sort order: ' + props.orderBy)
    }
  })
  
    
</script>
