<template>
  <label class="checkbox">
    <input type="checkbox" ref="checkboxInput" @change="checkboxChanged($event.target)">
    <span>{{ text }}</span>
  </label>
</template>

<script setup lang="ts">
  import { onMounted } from "vue"
  import { ref } from "vue"
  
  const checkboxInput = ref<HTMLInputElement>()
  
  const props = defineProps<{
    text: string
    startValue?: boolean
    onChanged?: (value: boolean) => void
  }>()
  
  onMounted(() => {
    if (!checkboxInput.value) throw new Error('Checkbox input is null')
    checkboxInput.value.checked = props.startValue
  })
  
  function checkboxChanged(checkbox: EventTarget | null) {
    if (!checkbox) throw new Error('Checkbox event target is null')
    const checked = (checkbox as HTMLInputElement).checked
    props.onChanged?.(checked)
  }
</script>

<style scoped lang="scss">
  input[type="checkbox"] {
    margin-right: 0.5rem;
  }
</style>
