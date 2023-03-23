<template>
  <div class="field is-grouped is-grouped-multiline is-align-items-center">
    <DraftCard v-if="showDraftCard" />
    <VariantCard v-for="(variant, index) of variantStore.variantList" :variant="variant" :key="index"
      @play-clicked="playClicked(variant)"
      @edit-variant="$router.push({name: 'edit-variant'})" />
    <PlayPopup ref="playPopup"/>
  </div>
</template>

<script setup lang="ts">
  import { useVariantStore } from '@/stores/variant'
  import { useAuthStore } from '@/stores/auth-user'
  import VariantCard from '@/components/ViewVariant/VariantCard.vue'
  import DraftCard from './DraftCard.vue'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import type { PublishedVariantGui } from '@/protochess/types'
  import { ref, computed } from 'vue'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
    
  const showDraftCard = computed(() => {
    // Do not show draft card if user is not logged in
    // Also wait until the variant list is fetched to avoid distracting pop-in
    // This means that if the server still has no variants, the draft card will
    // not show, but that will never happen in production
    return authStore.loggedUser && variantStore.variantList.length > 0
  })
  
  variantStore.refreshList().catch(e => {
    console.error(e)
    showPopup(
      'Cannot load variants',
      'There was an error loading the variants. Please try again later.',
      'ok'
    )
  })
  
  function playClicked(variant: PublishedVariantGui) {
    playPopup.value?.show(variant.uid)
  }
</script>

<style scoped lang="scss">
  .field {
    justify-content: center;
  }
</style>
