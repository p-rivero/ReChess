<template>
  <div>
    <p class="modal-card-title mb-3">Almost there!</p>
    
    <p class="mb-3">You just need to verify your email address. We've sent an email to <b>{{ authStore.loggedUser?.email }}</b>.</p>
    
    <p v-if="sentMessage" class="has-text-weight-light" >{{ sentMessage }}</p>
    <a v-else @click="resendEmail">Send again</a>
    
    <div class="is-flex mt-5">
      <p class="mr-3">Changed your mind?</p>
      <a @click="logout">Logout</a>
    </div>
    
  </div>
</template>


<script setup lang="ts">
  import { useAuthStore } from '@/stores/auth-user'
  import { ref } from 'vue'
  
  const authStore = useAuthStore()
  const sentMessage = ref<string>()
  
  defineExpose({
    init() {
      // Nothing to do at the moment
    },
    cleanup() {
      sentMessage.value = ''
    }
  })
  
  const emit = defineEmits<{
    (event: 'close-popup'): void
  }>()
  
  async function resendEmail() {
    try {
      sentMessage.value = 'Sending...'
      await authStore.sendEmailVerification()
      sentMessage.value = 'Sent!'
    } catch (error) {
      console.error(error)
      sentMessage.value = 'Too many email requests. Please try again later.'
    }
  }
  
  async function logout() {
    await authStore.signOut()
    emit('close-popup')
  }
  
</script>
