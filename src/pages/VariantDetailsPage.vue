<template>
  Viewing details of variant {{ state?.variantDisplayName }}
</template>


<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router'
  import { useVariantStore } from '@/stores/variant'
  import type { GameState } from '@/protochess/types'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  
  const state = ref<GameState>()
  
  onMounted(loadVariant)
  
  async function loadVariant() {
    if (!route.params.variantId || typeof route.params.variantId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    // Get variant info from the server
    state.value = await variantStore.getVariantState(route.params.variantId)
    if (!state.value) {
      // Variant ID is incorrect (or the uploader of this variant is malicious), redirect to home page
      router.push({ name: 'home' })
      return
    }
  }
  
</script>
