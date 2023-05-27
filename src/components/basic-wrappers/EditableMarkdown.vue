<template>
  <div>
    <div v-show="editing && editable">
      <SmartTextInput
        ref="textBox"
        :multiline="true"
        :placeholder="placeholder"
        :error-handler="errorHandler"
        :validator="errorHandler ? validatorProxy : undefined"
        @changed="text => currentText = text"
        @enter-pressed="save"
      />
      <div class="is-flex is-align-items-center">
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
        <p
          v-if="charLimit && currentLength > charLimit / 2"
          class="is-size-7 ml-5 mt-4"
          :class="{'has-text-danger': currentLength > charLimit}"
        >
          {{ currentLength }} / {{ charLimit }} characters
        </p>
      </div>
    </div>
    <div v-show="!editing || !editable">
      <p
        v-if="!text"
        class="is-italic"
      >
        No description
      </p>
      <div
        v-else
        class="content mb-3"
      >
        <VueMarkdown :source="text" />
      </div>
      <button
        v-if="editable"
        class="button mt-2"
        @click="toggleEdit(true)"
      >
        <div class="sz-icon icon-edit color-theme" />
        Edit description
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  
  import SmartTextInput from './SmartTextInput.vue'
  import VueMarkdown from 'vue-markdown-render'
  import type { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  
  const props = defineProps<{
    text?: string
    placeholder?: string
    editable: boolean
    charLimit?: number
    validator?: (text: string) => string | undefined
    errorHandler?: ErrorMessageHandler
  }>()
  
  const emit = defineEmits<{
    (event: 'save', text: string): void
  }>()
  
  const editing = ref(false)
  const hasError = ref(false)
  const textBox = ref<InstanceType<typeof SmartTextInput>>()
  const currentText = ref('')
  const currentLength = ref(0)
  
  // Intercept the validator to set hasError only if this field has an error
  function validatorProxy(text: string) {
    if (props.validator) {
      currentLength.value = text.length
      const error = props.validator(text)
      hasError.value = error !== undefined
      return error
    }
    return undefined
  }
  
  function toggleEdit(setEditing: boolean) {
    if (!textBox.value) throw new Error('Textbox not defined')
    currentText.value = props.text ?? ''
    textBox.value.setText(currentText.value)
    editing.value = setEditing
  }
  
  function save() {
    if (hasError.value) return
    emit('save', currentText.value)
    editing.value = false
  }
  
</script>
