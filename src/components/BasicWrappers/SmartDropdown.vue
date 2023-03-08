<template>
  <div class="select">
    <select ref="selectDropdown" @change="selectChanged($event.target)">
      <option v-for="item in props.items" :key="item" :value="item">{{ item }}</option>
    </select>
  </div>
</template>


<script setup lang="ts">
  import { onMounted, ref } from "vue"
  
  const selectDropdown = ref<HTMLInputElement>()
  
  const props = defineProps<{
    items: string[],
    startItem: string,
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', item: string): void
  }>()
  
  onMounted(() => {
    if (!selectDropdown.value) throw new Error('Dropdown is null')
    if (!props.items.includes(props.startItem)) throw new Error('Start item is not in items')
    selectDropdown.value.value = props.startItem
  })
  
  function selectChanged(dropdown: EventTarget | null) {
    if (!dropdown) throw new Error('Dropdown event target is null')
    const item = (dropdown as HTMLInputElement).value
    emit('changed', item)
  }
</script>
