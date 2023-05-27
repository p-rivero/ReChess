<template>
  <GenericUserReports
    :reports="variantReports.reports"
    :discard-reports="discardReports"
  >
    <div class="column is-flex is-align-self-center is-align-items-center">
      <ViewableChessBoard
        max-height="10rem"
        :white-pov="true"
        :view-only="true"
        :show-coordinates="false"
        :capture-wheel-events="false"
        :disable-refresh="true"
      />
      <div>
        <RouterLink
          class="is-size-4 is-break-word"
          :to="{ name: 'variant-details', params: { variantId: variant.uid } }"
        >
          {{ variant.displayName }}
        </RouterLink>
        <p class="is-size-5 is-break-word is-clickable">
          TODO: Click to visit
          By {{ variant.creatorDisplayName }}
        </p>
      </div>
    </div>
      
      
    <div class="column is-3 is-align-self-center">
      <p class="is-size-4 mr-3">
        {{ variant.numUpvotes }} upvotes
      </p>
      <p class="is-size-4 mr-3">
        Popularity: {{ variant.popularity }}
      </p>
    </div>
  </GenericUserReports>
</template>


<script setup lang="ts">
  import { type VariantReports, useModeratorStore } from '@/stores/moderator'
  import { computed } from 'vue'
  import GenericUserReports from './GenericReports.vue'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  
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
