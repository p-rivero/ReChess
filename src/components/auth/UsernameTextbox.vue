<template>
  <div>
    <SmartTextInput
      ref="usernameRef"
      class="mb-2"
      placeholder="your_username"
      :error-handler="errorHandler"
      :refresh-handler-on-input="true"
      :validator="text => {
        if (disableChecking) return
        if (text === '' && !strictMode) return
        if (text === '') return 'Please enter a username'
        if (text.length < 3) return 'Username must be at least 3 characters long'
        if (text.length > 25) return 'Username must be at most 25 characters long'
        if (!(/^[a-zA-Z0-9_]+$/).test(text)) return 'Username can only contain letters, numbers, and underscores'
      }"
      :start-text="username"
      @changed="updateUsername"
      @enter-pressed="emit('enter-pressed')"
    />
    <p
      v-show="username !== ''"
      class="help"
      :class="{
        'has-text-danger': usernameStatus === 'taken',
        'has-text-success': usernameStatus === 'available',
      }"
    >
      rechess.org/user/<b>{{ username }}</b>
      {{ usernameStatus === 'taken' ? 'is already taken' : usernameStatus === 'available' ? 'is available' : '' }}
    </p>
  </div>
</template>


<script setup lang="ts">

  import { debounce } from '@/helpers/ts-utils'
  import { ref } from 'vue'
  import { useAuthStore } from '@/stores/auth-user'
  import SmartTextInput from '@/components/basic-wrappers/SmartTextInput.vue'
  import type { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'

  const username = ref('')
  const usernameStatus = ref<'available' | 'taken' | 'unknown'>('unknown')
  const usernameRef = ref<InstanceType<typeof SmartTextInput>>()
  const authStore = useAuthStore()

  const props = defineProps<{
    errorHandler: ErrorMessageHandler
    strictMode?: boolean
    disableChecking?: boolean
  }>()
  
  const emit = defineEmits<{
    (event: 'enter-pressed'): void
  }>()
  
  defineExpose({
    focus: () => usernameRef.value?.focus(),
    triggerChanged: () => usernameRef.value?.triggerChanged(),
    setText: (text: string) => usernameRef.value?.setText(text),
    cleanup: () => {
      username.value = ''
      usernameStatus.value = 'unknown'
      usernameRef.value?.setText('')
    },
    
    username,
    usernameStatus,
  })
  
  
  
  async function updateUsername(name: string) {
    if (name === username.value) return
    username.value = name
    usernameStatus.value = 'unknown'
    if (name === '') return
    // Limit the number of requests to the server
    checkUsernameDebounced(name)
  }
  const checkUsernameDebounced = debounce(async (name: string) => {
    const available = await authStore.usernameAvailable(name)
    // This result is obsolete, user has already changed the username
    if (name !== username.value) return
    usernameStatus.value = available ? 'available' : 'taken'
    props.errorHandler.clear()
  }, 1000)
  
</script>
