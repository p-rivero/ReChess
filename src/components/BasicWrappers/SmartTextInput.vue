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
  import { onMounted, ref } from "vue"
  import type { ErrorMessageHandler, ErrorHandlerUser } from "@/utils/error-message-handler"
  
  const textInput = ref<HTMLInputElement>()
  const isError = ref<boolean>(false)
  
  const props = defineProps<{
    multiline: boolean,
    placeholder?: string,
    startText?: string,
    validator? : (text: string) => string | undefined
    errorHandler?: ErrorMessageHandler
    errorPriority?: number
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', text: string): void
  }>()
  
  if (props.validator) {
    if (!props.errorHandler) throw new Error('If a validator is provided, must also provide an ErrorMessageHandler')
    const errorHandlerUser: ErrorHandlerUser = {
      refresh: () => {
        const errorMsg = props.validator?.(textInput.value?.value ?? '')
        if (errorMsg) isError.value = true
        else isError.value = false
        return errorMsg
      },
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
    
    if (validate(text)) {
      emit('changed', text)
    }
  }
  
  function validate(text: string): boolean {
    if (props.validator) {
      // Run the validator, if the validator returns an error message, show it
      const errorMessage = props.validator(text)
      if (errorMessage) {
        // If there is some error, show it (even if it was already showing, since the error message may have changed)
        isError.value = true
        props.errorHandler?.show(errorMessage, props.errorPriority ?? 0)
        return false
      } else if (isError.value) {
        // If there is no error and the error message was showing, hide it
        isError.value = false
        props.errorHandler?.clear()
      }
    }
    return true
  }
</script>
