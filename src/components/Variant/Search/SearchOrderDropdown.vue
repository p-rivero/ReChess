<template>
  <div class="is-flex-grow-0 h-80 is-pulled-left is-small select">
    <select
      ref="select"
      class="pl-0"
      @change="onDropdownChange"
    >
      <option
        v-for="[key, value] in AVAILABLE_OPTIONS"
        :key="key"
        :value="value"
      >
        {{ value }}
      </option>
    </select>
  </div>
</template>


<script lang="ts">
  // Default order when not searching
  export const DEFAULT_ORDER = 'upvotes'
</script>

<script setup lang="ts">
  import { computed, ref, watchEffect } from 'vue'
  import type { SearchOrder } from '@/utils/chess/variant-search'
  
  const OPTIONS_TEXT: Record<SearchOrder, string> = {
    'search-relevance': 'Search relevance',
    'upvotes': 'Most upvoted',
    'newest': 'Newest',
  }
  
  const props = defineProps<{
    searching: boolean
    startOrder: SearchOrder | null
  }>()
  
  const selectedOrder = ref<SearchOrder | 'default'>(props.startOrder ?? 'default')
  const select = ref<HTMLSelectElement>()
  
  const emit = defineEmits<{
    (event: 'search-order-changed', order: SearchOrder): void
  }>()
  
  const AVAILABLE_OPTIONS = computed(() => {
    // Clone OPTIONS_TEXT into a [key, value] array
    let options = Object.entries(OPTIONS_TEXT)
    // If not searching, remove search relevance option
    if (!props.searching) {
      options = options.filter(([key]) => key !== 'search-relevance')
    }
    return options
  })
  
  function onDropdownChange(e: Event) {
    const target = e.target as HTMLSelectElement
    const selectedText = target.value
    const searchOptions = Object.keys(OPTIONS_TEXT) as SearchOrder[]
    const selectedOption = searchOptions.find(key => OPTIONS_TEXT[key] === selectedText)
    if (!selectedOption) {
      throw new Error('Invalid option: ' + selectedText)
    }
    selectedOrder.value = selectedOption
  }
  
  
  watchEffect(() => {
    // The user has not manually selected an order, use search relevance or default order
    if (selectedOrder.value === 'default') {
      setOrdering(props.searching ? 'search-relevance' : DEFAULT_ORDER)
      return
    }
    // The user has manually selected search relevance, but has stopped searching. Return to default order
    if (selectedOrder.value === 'search-relevance' && !props.searching) {
      // This will trigger watchEffect again
      selectedOrder.value = 'default'
      return
    }
    // Use the manually selected order
    setOrdering(selectedOrder.value)
  })
  
  function setOrdering(order: SearchOrder) {
    // If not mounted yet, do nothing
    if (!select.value) return
    // Set the dropdown value
    const textValue = OPTIONS_TEXT[order]
    select.value.value = textValue
    
    // Update the selected order in the store or trigger a re-search
    emit('search-order-changed', order)
  }
</script>


<style scoped lang="scss">
  .select select {
    font-size: 0.9rem;
    text-align: right;
    // Remove outline
    border: none;
    &:focus, &:active {
      box-shadow: none;
      border: none;
    }
    option {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      padding-right: 2rem;
    }
  }
  
  .h-80 {
    height: 80%;
  }
</style>
