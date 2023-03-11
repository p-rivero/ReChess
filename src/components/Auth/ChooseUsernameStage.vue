<template>
  <div>
    <p class="modal-card-title mb-3">Enter a username</p>
    
    <p class="mb-3">It cannot be changed later, so choose wisely!</p>
    
    <div class="mb-5">
      <SmartTextInput class="mb-2" ref="usernameRef" placeholder="your_username" 
        :error-handler="errorHandler"
        :refresh-handler-on-input="true"
        :validator="text => {
          if (text === '') return undefined
          if (text.length < 3) return 'Username must be at least 3 characters long'
          if (text.length > 25) return 'Username must be at most 25 characters long'
          if (!(/^[a-zA-Z0-9_]+$/).test(text)) return 'Username can only contain letters, numbers, and underscores'
        }"
        :start-text="username"
        @changed="updateUsername"/>
      <p class="help" v-show="username !== ''"
        :class="{
          'has-text-danger': usernameStatus === 'taken',
          'has-text-success': usernameStatus === 'available',
        }" >
        rechess.org/users/<b>{{ username }}</b>
        {{ usernameStatus === 'taken' ? 'is already taken' : usernameStatus === 'available' ? 'is available' : '' }}
      </p>
    </div>
    
    <SmartErrorMessage class="mb-4" v-show="hasError" :handler="errorHandler" />
    
    <div class="is-flex">
      <button class="button is-primary" @click="submit" :disabled="hasError || !username || usernameStatus !== 'available'">
        Submit
      </button>
    </div>
    
    <div class="is-flex mt-5">
      <p class="mr-3">Changed your mind?</p>
      <a @click="logout">Logout</a>
    </div>
    
  </div>
</template>


<script setup lang="ts">  
  import { useAuthStore } from '@/stores/auth-user'
  import { ref } from 'vue'
  import SmartTextInput from '../BasicWrappers/SmartTextInput.vue'
  import SmartErrorMessage from '../BasicWrappers/SmartErrorMessage.vue'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  import { debounce } from '@/utils/ts-utils'
  
  const authStore = useAuthStore()
  const username = ref('')
  const usernameStatus = ref<'available' | 'taken' | 'unknown'>('unknown')
  const hasError = ref(false)
  const errorHandler = new ErrorMessageHandler(hasError)
  
  defineExpose({
    init() {
      // Nothing to do at the moment
    },
    cleanup() {
      username.value = ''
      usernameStatus.value = 'unknown'
    }
  })
  
  const emit = defineEmits<{
    (event: 'close-popup'): void
    (event: 'check-verify'): void
  }>()
  
  
  
  async function updateUsername(name: string) {
    if (name === username.value) return
    username.value = name
    usernameStatus.value = 'unknown'
    if (name === '') return
    // Limit the number of requests to the server
    await checkDebounced(name)
  }
  const checkDebounced = debounce(async (name: string) => {
    const available = await authStore.checkUsername(name)
    // This result is obsolete, user has already changed the username
    if (name !== username.value) return
    usernameStatus.value = available ? 'available' : 'taken'
    errorHandler.clear()
  }, 1000)
  
  async function submit() {
    try {
      await authStore.thirdPartyRegister(username.value)
    } catch (e) {
      errorHandler.showException(e)
      return
    }
    emit('check-verify')
  }
  
  async function logout() {
    await authStore.signOut()
    emit('close-popup')
  }
  
</script>
