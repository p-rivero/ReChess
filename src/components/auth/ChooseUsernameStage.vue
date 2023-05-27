<template>
  <div>
    <p class="modal-card-title mb-3">
      Enter a username
    </p>
    
    <p class="mb-3">
      It cannot be changed later, so choose wisely!
    </p>
    
    <UsernameTextbox
      ref="usernameRef"
      class="mb-5"
      :error-handler="errorHandler"
      @enter-pressed="submit"
    />
    
    <SmartErrorMessage
      v-show="hasError"
      class="mb-4"
      :handler="errorHandler"
    />
    
    <p class="help mb-4">
      By creating an account, you agree to the <a href="/tos">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
    </p>
    
    <div class="is-flex">
      <button
        class="button is-primary"
        :class="{'is-loading': loading}"
        :disabled="submitDisabled"
        @click="submit"
      >
        Submit
      </button>
    </div>
    
    <div class="is-flex mt-5">
      <p class="mr-3">
        Changed your mind?
      </p>
      <a @click="authStore.signOut()">Logout</a>
    </div>
  </div>
</template>


<script setup lang="ts">
  import { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  import { computed, ref, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth-user'
  import SmartErrorMessage from '@/components/basic-wrappers/SmartErrorMessage.vue'
  import UsernameTextbox from './UsernameTextbox.vue'
  
  const authStore = useAuthStore()
  const hasError = ref(false)
  const loading = ref(false)
  const errorHandler = new ErrorMessageHandler(hasError)
  const usernameRef = ref<InstanceType<typeof UsernameTextbox>>()
  
  const submitDisabled = computed(() => {
    if (!usernameRef.value) return true
    return hasError.value || loading.value || !usernameRef.value.username || usernameRef.value.usernameStatus !== 'available'
  })
  
  defineExpose({
    init() {
      if (!usernameRef.value) throw new Error('usernameRef not found')
      usernameRef.value.focus()
      usernameRef.value.triggerChanged()
    },
    cleanup() {
      usernameRef.value?.cleanup()
      hasError.value = false
      loading.value = false
    },
  })
  
  const emit = defineEmits<{
    (event: 'close-popup'): void
    (event: 'check-verify'): void
  }>()
  
  
  
  async function submit() {
    if (!usernameRef.value) throw new Error('usernameRef not found')
    if (submitDisabled.value) return
    loading.value = true
    try {
      await authStore.thirdPartyRegister(usernameRef.value.username)
    } catch (e) {
      errorHandler.showException(e)
      return
    } finally {
      loading.value = false
    }
    emit('check-verify')
  }
  
  watch(authStore, store => {
    if (!store.loggedUser) emit('close-popup')
  })
  
</script>
