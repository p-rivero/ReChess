<template>
  <div>
    <p class="modal-card-title mb-3">Almost there!</p>
    
    <p class="mb-3">You just need to verify your email address. We've sent an email to <b>{{ authStore.user?.email }}</b>.</p>
    
    <a @click="resendEmail">Send again</a>
    
    <div class="is-flex mt-5">
      <p class="mr-3">Changed your mind?</p>
      <a @click="hide">Logout</a>
    </div>
    
  </div>
</template>


<script setup lang="ts">  
  import { useAuthStore } from '@/stores/auth-user'
  
  const authStore = useAuthStore()
  
  defineExpose({
    init() {
      // Nothing to do at the moment
    },
    hide() {
      // Nothing to do at the moment
    }
  })
  
  function resendEmail() {
    // authStore.sendEmailVerification()
  }
  
</script>
