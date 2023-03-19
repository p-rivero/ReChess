<template>
  <div class="columns">
    <div class="column is-5">
      <p class="is-size-2 mb-2">{{ variant?.displayName }}</p>
      <p class="is-size-5 has-text-weight-semibold mb-5">Created by <a>{{ variant?.creatorDisplayName }}</a></p>
      <p>{{ variant?.description }}</p>
    </div>
    
    <div class="column is-6 columns reverse-columns">
      <div class="column mt-2 is-5 is-narrow">
        <button class="button is-primary is-fullwidth mb-4" @click="playPopup?.show(variant?.uid)">
          <div class="sz-icon icon-knight color-white"></div>
          Play
        </button>
        <button class="button is-fullwidth mb-4" @click="$router.push({ name: 'analysis', params: {variantId: variant?.uid} })">
          <div class="sz-icon icon-analysis color-theme"></div>
          Analysis board
        </button>
        <button class="button is-fullwidth mb-4" @click="useAsTemplate">
          <div class="sz-icon icon-edit color-theme"></div>
          Use as template
        </button>
        <button class="button is-fullwidth mb-4">
          <div class="sz-icon icon-report color-theme"></div>
          Report
        </button>
      </div>
      
      <div class="column mt-2 is-8">
        <ViewableChessBoard ref="board" class="not-clickable" :white-pov="true" :view-only="true" :show-coordinates="true" :capture-wheel-events="false" />
      </div>
    </div>
  </div>
  <PlayPopup ref="playPopup" />
</template>


<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter, useRoute } from 'vue-router'
  import { useVariantStore } from '@/stores/variant'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import type { PublishedVariantGui } from '@/protochess/types'
  import ViewableChessBoard from '@/components/ChessBoard/ViewableChessBoard.vue'
  import PlayPopup from '@/components/Popup/PlayPopup.vue'
  import { showPopup } from '@/components/Popup/popup-manager';
  import { clone } from '@/utils/ts-utils'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  const draftStore = useVariantDraftStore()
  
  const variant = ref<PublishedVariantGui>()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  
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
  
  function useAsTemplate() {
    if (!draftStore.hasDraft()) {
      // Nothing will be lost, so just go ahead and edit
      draftStore.state = clone(variant.value!)
      router.push({ name: 'edit-variant' })
      return
    }
    const nameDetails = draftStore.state.displayName ?
      ` named "${draftStore.state.displayName}"` : ''
    showPopup('Overwrite draft?', `You can only store one draft at a time, 
      but it seems you already have a draft${nameDetails}. 
      Do you want to overwrite it?.`,
      'yes-no',
      () => {
        draftStore.state = clone(variant.value!)
        router.push({ name: 'edit-variant' })
      }
    )
  }
  
</script>

<style scoped lang="scss">
  .not-clickable {
    pointer-events: none;
  }
  
  @media screen and (max-width: 1023px) {
    .reverse-columns {
      display: flex;
      flex-direction: column-reverse;
      
      .column {
        width: 100%;
      }
    }
  }
</style>
