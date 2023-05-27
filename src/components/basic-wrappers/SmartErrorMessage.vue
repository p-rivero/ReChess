<template>
  <p class="has-text-danger">
    {{ errorMessage }}
  </p>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  const errorMessage = ref<string>('')
  
  const props = defineProps<{
    handler: ErrorMessageHandler
  }>()
  
  props.handler.registerText({ show: (error: string) => { errorMessage.value = error } })
  
</script>
