<template>
  <div class="is-flex is-flex-direction-row is-justify-content-center">
    <div class="box is-flex">
      <p class="control has-icons-left has-icons-right is-flex-grow-1">
        <SmartTextInput
          class="is-medium"
          placeholder="Search variants..."
          :start-text="lastSearchText"
          @changed="text => search(text)"
        />
        <span class="icon is-small is-left px-3 py-3">
          <div class="icon-search color-theme" />
        </span>
        <span class="icon sort-dropdown is-flex mr-1">
          <SearchOrderDropdown
            :searching="searching"
            :start-order="lastSearchOrder"
            @search-order-changed="order => lastSearchOrder = order"
          />
        </span>
      </p>
    </div>
  </div>
  
  <div
    v-if="searching"
    class="field is-grouped is-grouped-multiline is-align-items-center is-justify-content-center"
  >
    <SearchCard
      v-for="searchResult of searchResultsSorted"
      :key="searchResult.id"
      :variant-id="searchResult.id"
      :variant-name="searchResult.name"
      :matches="searchResult.matches"
      :current-search-score="searchResult.searchScore"
      :order-by="lastSearchOrder"
      @play-clicked="variant => playClicked(variant)"
      @update-score="score => searchResult.sortScore = score"
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
    />
  </div>
  
  <PlayPopup ref="playPopup" />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useVariantStore } from '@/stores/variant'
  import { useAuthStore } from '@/stores/auth-user'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import VariantCard from '@/components/Variant/View/VariantCard.vue'
  import DraftCard from '@/components/Variant/View/DraftCard.vue'
  import SearchCard from '@/components/Variant/Search/SearchCard.vue'
  import SearchOrderDropdown from '@/components/Variant/Search/SearchOrderDropdown.vue'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { updateTitle } from '@/utils/web-utils'
  import { searchVariants } from '@/utils/chess/variant-search'
  import type { PublishedVariantGui } from '@/protochess/types'
  import type { SearchOrder, VariantIndexResult } from '@/utils/chess/variant-search'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
    
  const searching = ref(false)
  const searchResults = ref<VariantIndexResult[]>([])
  
  const searchResultsSorted = computed(() => {
    // Avoid sorting if the search results have not been scored yet
    if (searchResults.value.length === 0 || isNaN(searchResults.value[0].sortScore)) {
      return searchResults.value
    }
    const shallowCopy = [...searchResults.value]
    // Sort in descending order
    return shallowCopy.sort((a, b) => b.sortScore - a.sortScore)
  })
    
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
  
  const lastSearchOrder = ref<SearchOrder>('search-relevance')
  const lastSearchText = ref('')
  
  async function search(text: string) {
    lastSearchText.value = text
    text = text.trim()
    if (text.length === 0) {
      searching.value = false
      return
    }
    // Wait until the index has been fetched before setting searching to true
    searchResults.value = await searchVariants(text, 10)
    searching.value = true
  }
  
  
  // Store the last search in session storage so that it can be restored
  // when the user navigates back to the home page
  const storedSearchText = sessionStorage.getItem('last-search-text')
  const storedSearchOrder = sessionStorage.getItem('last-search-order') as SearchOrder | null
  if (storedSearchText) {
    search(storedSearchText)
  }
  if (storedSearchOrder) {
    lastSearchOrder.value = storedSearchOrder
  }
  watch(lastSearchText, text => sessionStorage.setItem('last-search-text', text))
  watch(lastSearchOrder, order => sessionStorage.setItem('last-search-order', order))
</script>

<style lang="scss" scoped>
  .box {
    padding: 0;
    max-width: 1000px;
    flex-grow: 1;
  }
  
  // Override Bulma's default styling
  .control.has-icons-left span.icon.sort-dropdown {
    pointer-events: inherit;
    position: absolute;
    width: auto;
    top: 0;
    right: 0;
  }
</style>
