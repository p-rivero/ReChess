<template>
  <input class="input" type="number" ref="numberInput"
    :placeholder="placeholder" :min="props.min" :max="props.max"
    @input="inputChanged($event?.target)">
</template>

<script setup lang="ts">
  import { onMounted } from "vue"
  import { ref } from "vue"
  
  const numberInput = ref<HTMLInputElement>()
  
  const props = defineProps<{
    placeholder?: string,
    min?: number,
    max?: number,
    default: number,
    startValue: number,
    onChanged?: (value: number) => void
  }>()
  
  const placeholder = props.placeholder || props.default.toString()
  
  onMounted(() => {
    if (!numberInput.value) throw new Error('Number input is null')
    // If the value of the input is the default, don't set it and show the placeholder instead
    if (props.startValue !== props.default) {
      numberInput.value.value = props.startValue.toString()
    }
  })
  
  function inputChanged(input: EventTarget | null) {
    if (!input) throw new Error('Number input event target is null')
    const valueStr = (input as HTMLInputElement).value
    let value = parseInt(valueStr)
    if (isNaN(value)) value = props.default
    if (props.min !== undefined && value < props.min) value = props.min
    if (props.max !== undefined && value > props.max) value = props.max
    props.onChanged?.(value)
  }
</script>
