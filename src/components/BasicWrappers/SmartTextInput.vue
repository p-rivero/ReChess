<template>
  <input v-if="!$props.multiline" class="input" ref="textInput"
    :class="{'is-danger': isError}"
    :placeholder="props.placeholder"
    @input="inputChanged()">
  <textarea v-else class="textarea" ref="textInput"
    :class="{'is-danger': isError}"
    :placeholder="props.placeholder"
    @input="inputChanged()">
  </textarea>
</template>

<script setup lang="ts">
  import { onMounted } from "vue"
  import { ref } from "vue"
  import type { ErrorMessageHandler, ErrorHandlerUser } from "@/utils/ErrorMessageHandler"
  
  const textInput = ref<HTMLInputElement>()
  const isError = ref<boolean>(false)
  
  const props = defineProps<{
    multiline: boolean,
    placeholder?: string,
    startText?: string,
    onChanged?: (text: string) => void
    validator? : (text: string) => string | undefined
    errorHandler?: ErrorMessageHandler
    errorPriority?: number
  }>()
  
  if (props.validator) {
    if (!props.errorHandler) throw new Error('Must provide SmartErrorMessage ref if validator is provided')
    const errorHandlerUser: ErrorHandlerUser = {
      refresh: () => props.validator?.(textInput.value?.value ?? ''),
      priority: props.errorPriority ?? 0,
    }
    props.errorHandler.register(errorHandlerUser)
  }
  
  onMounted(() => {
    if (!textInput.value) throw new Error('Number input is null')
    textInput.value.value = props.startText ?? ''
    // Highlight in red if initial value is invalid
    validate(textInput.value.value)
  })
  
  function inputChanged() {
    if (!textInput.value) throw new Error('Number input is null')
    let text = textInput.value.value
    if (text === '') text = props.placeholder ?? ''
    
    if (validate(text)) {
      props.onChanged?.(text)
    }
  }
  
  function validate(text: string): boolean {
    if (props.validator) {
      // Run the validator, if the validator returns an error message, show it
      const errorMessage = props.validator(text)
      if (errorMessage) {
        isError.value = true
        props.errorHandler?.show(errorMessage, props.errorPriority ?? 0)
        return false
      } else {
        isError.value = false
        props.errorHandler?.clear()
      }
    }
    return true
  }
</script>
