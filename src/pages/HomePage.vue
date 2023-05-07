<template>
  <div class="is-flex is-flex-direction-row is-justify-content-center">
    <div class="box is-flex">
      <p class="control has-icons-left has-icons-right is-flex-grow-1">
        <SmartTextInput
          class="is-medium"
          placeholder="Search..."
          @changed="search"
        />
        <span class="icon is-small is-left px-3 py-3">
          <div class="icon-search color-theme" />
        </span>
        <span class="icon sort-dropdown is-flex mr-1">
          <SearchOrderDropdown
            :searching="searching"
            :start-order="orderBy"
            @search-order-changed="order => orderBy = order"
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
      :order-by="orderBy"
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
      v-for="variant of variantStore.variantList"
      :key="variant.uid"
      :variant="variant"
    />
  </div>
</template>

<script setup lang="ts">
  import { DEFAULT_ORDER, searchVariants } from '@/utils/chess/variant-search'
  import { computed, ref, watch } from 'vue'
  import { debounce } from '@/utils/ts-utils'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useVariantStore } from '@/stores/variant'
  import DraftCard from '@/components/Variant/View/DraftCard.vue'
  import SearchCard from '@/components/Variant/Search/SearchCard.vue'
  import SearchOrderDropdown from '@/components/Variant/Search/SearchOrderDropdown.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  import VariantCard from '@/components/Variant/View/VariantCard.vue'
  import type { SearchOrder, VariantIndexResult } from '@/utils/chess/variant-search'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
    
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
    return authStore.loggedUser && variantStore.variantListFetched
  })
  
  const orderBy = ref<SearchOrder>('search-relevance')
  const tags = ref<string[]>([])
  
  async function search(text: string) {
    // Extract tags from the query (prefixed with #)
    const TAG_REGEX = /#[^\s#,]+/g
    const queryTags = text.match(TAG_REGEX)?.map(tag => tag.slice(1).toLowerCase()) ?? []
    
    const queryText = text
      .replace(TAG_REGEX, '') // Remove tags from the query
      .replace(/#/g, '')      // Remove any '#' symbols that were not tags
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim()
      .toLowerCase()
    
    if (queryText.length === 0) {
      tags.value = queryTags
      searching.value = false
      return
    }
    // Wait until the index has been fetched before setting searching to true
    searchResults.value = await searchVariants(queryText, queryTags, 10)
    searching.value = true
  }
  
  
  // Persist the search order in session storage
  const storedSearchOrder = sessionStorage.getItem('search-order') as SearchOrder | null
  if (storedSearchOrder) {
    orderBy.value = storedSearchOrder
  }
  watch(orderBy, async order => {
    sessionStorage.setItem('search-order', order)
    refreshVariantList()
  })
  const refreshVariantListDebounced = debounce(refreshVariantList, 500)
  watch(tags, () => refreshVariantListDebounced())
  
  
  // Load the variant list at startup
  refreshVariantList()
  async function refreshVariantList() {
    let order = orderBy.value
    if (order === 'search-relevance') {
      order = DEFAULT_ORDER
    }
    try {
      await variantStore.refreshList(order, tags.value)
    } catch (e) {
      console.error(e)
      showPopup(
        'Cannot load variants',
        'There was an error loading the variants. Please try again later.',
        'ok'
      )
    }
  }
  
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
