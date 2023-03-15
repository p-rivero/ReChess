<template>
  <div class="field is-grouped is-grouped-multiline is-align-items-center">
    <VariantCard v-for="(state, index) of variantStore.variantList" :variant="state" :key="index"
      @play-clicked="playClicked(state)"/>
    <PlayPopup ref="playPopup"/>
  </div>
</template>

<script setup lang="ts">
  import { useVariantStore } from '@/stores/variant'
  import VariantCard from '@/components/ViewVariant/VariantCard.vue'
  import PlayPopup from '@/components/Popup/PlayPopup.vue'
  import type { PublishedVariantGui } from '@/protochess/types'
  import { ref } from 'vue'
  
  const variantStore = useVariantStore()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  
  variantStore.refreshList()
  
  function playClicked(variant: PublishedVariantGui) {
    playPopup.value?.show(variant.uid)
  }
</script>

<style scoped lang="scss">
  .field {
    justify-content: center;
  }
</style>