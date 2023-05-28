<template>
  <VueMarkdown
    class="has-text-danger"
    :source="errorMessage"
  />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import VueMarkdown from 'vue-markdown-render'
  import type { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  const errorMessage = ref<string>('')
  
  const props = defineProps<{
    handler: ErrorMessageHandler
  }>()
  
  props.handler.registerText({ show: (error: string) => { errorMessage.value = error } })
  
</script>
