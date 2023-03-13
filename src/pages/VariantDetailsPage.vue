<template>
  <p class="is-size-2 mb-2">{{ variant?.displayName }}</p>
  <p class="is-size-5 has-text-weight-semibold mb-5">Created by <a>{{ variant?.creatorDisplayName }}</a></p>
  <p>{{ variant?.description }}</p>
  <div class="board-container" ref="container">
    <ViewableChessBoard ref="board" :white-pov="true" :view-only="true" :show-coordinates="false" :capture-wheel-events="false" />
  </div>
</template>


<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter, useRoute } from 'vue-router'
  import { useVariantStore } from '@/stores/variant'
  import type { PublishedVariantGui } from '@/protochess/types'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  
  const variant = ref<PublishedVariantGui>()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  // Begin async loading of variant data
  onMounted(async () => {
    await loadVariant()
  })
  
  async function loadVariant() {
    if (!route.params.variantId || typeof route.params.variantId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    // Get variant info from the server
    variant.value = await variantStore.getVariant(route.params.variantId)
    if (!variant.value) {
      // Variant ID is incorrect (or the uploader of this variant is malicious), redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    board.value?.setState(variant.value)
  }
  
</script>

<style scoped lang="scss">
  .board-container {
    max-width: 20rem;
  }
</style>
