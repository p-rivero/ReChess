<template>
  <div>
    <div v-show="editing && editable">
      <SmartTextInput
        ref="textInput"
        class="is-large"
        :multiline="false"
        :placeholder="placeholder"
        :error-handler="errorHandler"
        :validator="errorHandler ? validatorProxy : undefined"
        @changed="text => currentText = text.trim()"
        @enter-pressed="save"
      />
      <div class="is-flex">
        <button
          class="button is-primary mt-2 mr-2"
          :disabled="hasError"
          @click="save"
        >
          <div class="sz-icon icon-save color-white" />
          Done
        </button>
        <button
          v-if="editable"
          class="button mt-2"
          @click="toggleEdit(false)"
        >
          <div class="sz-icon icon-cross color-theme" />
          Cancel
        </button>
      </div>
    </div>
    <div v-show="!editing || !editable">
      <p class="is-size-2 is-break-word">
        {{ text }}
      </p>
      <button
        v-if="editable"
        class="button mt-1"
        @click="toggleEdit(true)"
      >
        <div class="sz-icon icon-edit color-theme" />
        {{ editButtonText }}
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  
  import SmartTextInput from './SmartTextInput.vue'
  import type { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  
  const props = defineProps<{
    editButtonText: string
    text: string
    placeholder?: string
    editable: boolean
    validator?: (text: string) => string | undefined
    startEditCallback?: () => boolean
    errorHandler?: ErrorMessageHandler
  }>()
  
  const emit = defineEmits<{
    (event: 'save', text: string): void
  }>()
  
  const editing = ref(false)
  const hasError = ref(false)
  const textInput = ref<InstanceType<typeof SmartTextInput>>()
  const currentText = ref('')
  
  // Intercept the validator to set hasError only if this field has an error
  function validatorProxy(text: string) {
    if (props.validator) {
      const error = props.validator(text.trim())
      hasError.value = error !== undefined
      return error
    }
  }
  
  function toggleEdit(setEditing: boolean) {
    if (!textInput.value) {
      throw new Error('TextInput not defined')
    }
    if (props.startEditCallback && !props.startEditCallback()) {
      return
    }
    currentText.value = props.text === props.placeholder ? '' : props.text
    textInput.value.setText(currentText.value)
    editing.value = setEditing
  }
  
  function save() {
    if (hasError.value) return
    emit('save', currentText.value)
    editing.value = false
  }
  
</script>
