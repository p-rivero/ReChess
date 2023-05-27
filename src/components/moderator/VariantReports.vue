<template>
  <GenericUserReports
    :store-key="'variant-' + storeKey"
    :reports="variantReports.reports"
    :discard-reports="discardReports"
  >
    <div class="column is-flex is-align-self-center is-align-items-center">
      <div
        ref="container"
        class="board-container is-flex is-align-items-center mr-4"
      >
        <div class="w-100">
          <ViewableChessBoard
            ref="board"
            max-height="10rem"
            :white-pov="true"
            :view-only="true"
            :show-coordinates="false"
            :capture-wheel-events="false"
            :disable-refresh="true"
          />
        </div>
      </div>
      <div>
        <RouterLink
          class="is-size-4 is-break-word"
          :to="{ name: 'variant-details', params: { variantId: variant.uid } }"
        >
          {{ variant.displayName }}
        </RouterLink>
        <p
          v-if="variant.creatorId"
          class="is-size-5 is-break-word is-clickable"
          @click="goToProfile(userStore, variant.creatorId)"
        >
          By {{ variant.creatorDisplayName }}
        </p>
        <i v-else>
          User deleted
        </i>
      </div>
    </div>
      
      
    <div class="column is-3 is-align-self-center">
      <p class="is-size-5 mr-3">
        Upvotes: {{ variant.numUpvotes }}
      </p>
      <p class="is-size-5 mr-3">
        Popularity: {{ variant.popularity }}
      </p>
    </div>
  </GenericUserReports>
</template>


<script setup lang="ts">
  import { type VariantReports, useModeratorStore } from '@/stores/moderator'
  import { computed, onMounted, ref } from 'vue'
  import { goToProfile } from '@/helpers/managers/navigation-manager'
  import { useUserStore } from '@/stores/user'
  import GenericUserReports from './GenericReports.vue'
  import ViewableChessBoard from '@/components/chessboard/ViewableChessBoard.vue'
  
  const moderatorStore = useModeratorStore()
  const userStore = useUserStore()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  const props = defineProps<{
    storeKey: string
    variantReports: VariantReports
  }>()
  
  const variant = computed(() => props.variantReports.reportedVariant)
  
  onMounted(() => {
    board.value?.setState(variant.value)
  })
  
  async function discardReports(indexes: Set<number>) {
    const variantId = variant.value.uid
    await moderatorStore.discardVariantReports(variantId, indexes)
  }
</script>


<style scoped lang="scss">
  .board-container {
    width: 10rem;
  }
</style>
