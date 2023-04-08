<template>
  <input
    ref="numberInput"
    class="input"
    type="number"
    :placeholder="placeholder || props.default.toString()"
    :min="props.min"
    :max="props.max"
    @input="inputChanged($event.target)"
    @blur="onBlur($event.target)"
  >
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  
  const numberInput = ref<HTMLInputElement>()
  
  const props = defineProps<{
    placeholder?: string,
    min?: number,
    max?: number,
    default: number,
    startValue: number,
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', value: number): void
  }>()
    
  onMounted(() => {
    if (!numberInput.value) throw new Error('Number input is null')
    // If the value of the input is the default, don't set it and show the placeholder instead
    const usePlaceholder = props.placeholder && props.startValue === props.default
    if (!usePlaceholder) {
      console.log('setting value', props.startValue)
      numberInput.value.value = props.startValue.toString()
    }
  })
  
  function inputChanged(input: EventTarget | null) {
    if (!input) throw new Error('Number input event target is null')
    const valueStr = (input as HTMLInputElement).value
    const value = parseInt(valueStr)
    emit('changed', normalizeValue(value))
  }
  
  function onBlur(input: EventTarget | null) {
    if (!input) throw new Error('Number input event target is null')
    const inputElement = input as HTMLInputElement
    const valueStr = inputElement.value
    const value = parseInt(valueStr)
    inputElement.value = normalizeValue(value).toString()
  }
  
  function normalizeValue(value: number) {
    if (isNaN(value)) value = props.default
    if (props.min !== undefined && value < props.min) value = props.min
    if (props.max !== undefined && value > props.max) value = props.max
    return value
  }
</script>
