<template>
  <p v-if="errorMessage" class="has-text-danger">
    {{ errorMessage }}
  </p>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { ErrorMessageHandler } from '@/utils/ErrorMessageHandler'
  const errorMessage = ref<string>('')
  
  const props = defineProps<{
    handler: ErrorMessageHandler
  }>()
  
  console.log('registering text')
  props.handler.registerText({show: (error: string) => {console.log("aaa: " + error); errorMessage.value = error}})
  
</script>
