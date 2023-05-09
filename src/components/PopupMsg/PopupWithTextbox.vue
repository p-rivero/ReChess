<template>
  <PopupMessage ref="popupMessage">
    <SmartTextInput
      ref="textInput"
      class="mt-5"
      :multiline="false"
      :placeholder="hint"
    />
  </PopupMessage>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  import PopupMessage from './PopupMessage.vue'
  import SmartTextInput from '@/components/BasicWrappers/SmartTextInput.vue'
  
  const popupMessage = ref<InstanceType<typeof PopupMessage>>()
  const textInput = ref<InstanceType<typeof SmartTextInput>>()
    
  defineProps<{
    hint?: string,
  }>()
  
  defineExpose({
    show(
      important: boolean,
      title: string,
      message: string,
      buttons: 'ok' | 'ok-cancel' | 'yes-no',
      accept?: (text: string) => void,
      cancel?: () => void
    ) {
      if (!popupMessage.value) {
        throw new Error('PopupMessage not found')
      }
      textInput.value?.setText('')
      popupMessage.value.show(important, title, message, buttons, onAccept, cancel)
      function onAccept() {
        const text = textInput.value?.getText() ?? ''
        accept?.(text)
      }
    },
    hide: () => popupMessage.value?.hide(),
  })
</script>
