<template>
  <input class="input" ref="textInput"
    :placeholder="props.placeholder"
    @input="inputChanged($event.target)">
</template>

<script setup lang="ts">
  import { onMounted } from "vue"
  import { ref } from "vue"
  
  const textInput = ref<HTMLInputElement>()
  
  const props = defineProps<{
    placeholder?: string,
    startText?: string,
    onChanged?: (text: string) => void
    // TODO: Validator
  }>()
    
  onMounted(() => {
    if (!textInput.value) throw new Error('Number input is null')
    textInput.value.value = props.startText ?? ''
  })
  
  function inputChanged(input: EventTarget | null) {
    if (!input) throw new Error('Number input event target is null')
    let text = (input as HTMLInputElement).value
    if (text === '') text = props.placeholder ?? ''
    props.onChanged?.(text)
  }
</script>
