<template>
  <input
    v-if="!multiline"
    ref="textInput"
    class="input"
    :type="type"
    :class="{'is-danger': isError}"
    :placeholder="props.placeholder"
    @input="inputChanged"
    @keydown.enter="emit('enter-pressed')"
  >
  <textarea
    v-else
    ref="textInput"
    class="textarea"
    :class="{'is-danger': isError}"
    :type="type"
    :placeholder="props.placeholder"
    @input="inputChanged"
  />
</template>

<script setup lang="ts">
  import { nextTick, onMounted, ref } from 'vue'
  import type { ErrorHandlerUser, ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  
  const textInput = ref<HTMLInputElement>()
  const isError = ref<boolean>(false)
  
  const props = defineProps<{
    multiline?: boolean,
    type?: 'text'|'email'|'password'|'date'|'time'|'datetime-local'|'month'|'week'|'url'|'tel'|'color',
    placeholder?: string,
    startText?: string,
    validator? : (text: string) => string | undefined
    refreshHandlerOnInput?: boolean
    errorHandler?: ErrorMessageHandler
    errorPriority?: number
    emitChangedWhenError?: boolean
  }>()
  
  const emit = defineEmits<{
    (event: 'changed', text: string): void
    (event: 'enter-pressed'): void
  }>()
  
  
  defineExpose({
    focus() {
      nextTick(() => {
        if (!textInput.value) throw new Error('Text input is null')
        textInput.value.focus()
      })
    },
    setText(text: string) {
      if (!textInput.value) throw new Error('Text input is null')
      textInput.value.value = text
      validate(text)
    },
    getText(): string {
      if (!textInput.value) throw new Error('Text input is null')
      return textInput.value.value
    },
    triggerChanged() {
      inputChanged()
    },
  })
  
  
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
    
    const validated = validate(text)
    // When emitChangedWhenError flag is set, emit the changed event even if the input is invalid
    if (validated || props.emitChangedWhenError)
      emit('changed', text)
    // When refreshHandlerOnInput flag is set, always refresh the error message (not needed if this validator already failed)
    if (validated && props.refreshHandlerOnInput)
      props.errorHandler?.clear()
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
