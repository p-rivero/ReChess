<template>
  <div class="is-flex is-flex-direction-row is-justify-content-center">
    <div class="box">
      <p class="control has-icons-left has-icons-right">
        <SmartTextInput
          class="is-medium"
          placeholder="Search variants..."
          @changed="search"
        />
        <span class="icon is-small is-left px-3 py-3">
          <div class="icon-search color-theme" />
        </span>
      </p>
    </div>
  </div>
    
  <div
    v-if="searching"
    class="field is-grouped is-grouped-multiline is-align-items-center is-justify-content-center"
  >
    <SearchCard
      v-for="searchResult of searchResults"
      :key="searchResult.id"
      :search-result="searchResult"
    />
    <div
      v-if="searchResults.length === 0"
      class="mt-6 is-flex is-align-items-center"
    >
      <p class="is-size-5 mr-4">
        No results
      </p>
      <div class="icon-sad color-theme sz-2" />
    </div>
  </div>
  <div
    v-else
    class="field is-grouped is-grouped-multiline is-align-items-center is-justify-content-center"
  >
    <DraftCard v-if="showDraftCard" />
    <VariantCard
      v-for="(variant, index) of variantStore.variantList"
      :key="index"
      :variant="variant"
      @play-clicked="playClicked(variant)"
      @edit-variant="$router.push({name: 'edit-variant'})"
    />
  </div>
  
  <PlayPopup ref="playPopup" />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useVariantStore } from '@/stores/variant'
  import { useAuthStore } from '@/stores/auth-user'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import VariantCard from '@/components/Variant/View/VariantCard.vue'
  import DraftCard from '@/components/Variant/View/DraftCard.vue'
  import SearchCard from '@/components/Variant/Search/SearchCard.vue'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { updateTitle } from '@/utils/web-utils'
  import { searchVariants } from '@/utils/chess/variant-search'
  import type { PublishedVariantGui } from '@/protochess/types'
  import type { VariantIndexResult } from '@/utils/chess/variant-search'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
    
  const searching = ref(false)
  const searchResults = ref<VariantIndexResult[]>([])
    
  const showDraftCard = computed(() => {
    // Do not show draft card if user is not logged in
    // Also wait until the variant list is fetched to avoid distracting pop-in
    // This means that if the server still has no variants, the draft card will
    // not show, but that will never happen in production
    return authStore.loggedUser && variantStore.variantList.length > 0
  })
  
  onMounted(() => updateTitle())
  
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
  
  async function search(text: string) {
    text = text.trim()
    if (!text) {
      searching.value = false
      return
    }
    // Wait until the index has been fetched before setting searching to true
    searchResults.value = await searchVariants(text, 10)
    searching.value = true
  }
</script>

<style lang="scss" scoped>
  .box {
    padding: 0;
    max-width: 1000px;
    flex-grow: 1;
  }
</style>
