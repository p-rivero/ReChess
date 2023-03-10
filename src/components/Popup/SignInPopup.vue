<template>
  <div class="modal" ref="popup">
    <div class="modal-background" @click="closePopup(true)"></div>
    <div class="box modal-card signin-card">
      
      <LoginRegisterStage v-show="currentStage === 'loginRegister'" ref="loginRegisterStage"
        @check-verify="checkEmailVerified" @choose-username="chooseUsername"/>
        
      <VerifyEmailStage v-show="currentStage === 'verifyEmail'" ref="verifyEmailStage" 
        @close-popup="closePopup"/>
      
    </div>
  </div>
</template>


<script setup lang="ts">

  import { ref } from 'vue'
  import { checkEmailVerified } from '@/components/Auth/auth-manager';
  import LoginRegisterStage from '@/components/Auth/LoginRegisterStage.vue'
  import VerifyEmailStage from '@/components/Auth/VerifyEmailStage.vue';
  
  const popup = ref<HTMLElement>()
  const loginRegisterStage = ref<InstanceType<typeof LoginRegisterStage>>()
  const verifyEmailStage = ref<InstanceType<typeof VerifyEmailStage>>()
  
    
  type Stage = 'loginRegister'|'chooseUsername'|'verifyEmail'
  const currentStage = ref<Stage>()
    
  defineExpose({
    async show(stage: Stage) {
      cleanupCurrentStage()
      currentStage.value = stage
      initCurrentStage()
      popup.value?.classList.add('is-active')
      document.documentElement.classList.add('is-clipped')
    },
    hide: closePopup,
  })
  
  
  
  function initCurrentStage() {
    switch (currentStage.value) {
      case 'loginRegister':
        loginRegisterStage.value?.init()
        break
      case 'chooseUsername':
        // TODO
        break
      case 'verifyEmail':
        verifyEmailStage.value?.init()
        break
    }
    // TODO
  }
  function cleanupCurrentStage() {
    switch (currentStage.value) {
      case 'loginRegister':
        loginRegisterStage.value?.cleanup()
        break
      case 'chooseUsername':
        // TODO
        break
      case 'verifyEmail':
        verifyEmailStage.value?.cleanup()
        break
    }
    currentStage.value = undefined
  }
  
  function closePopup(clickBackground = false) {
    // Only allow closing if we're in the loginRegister stage
    if (clickBackground && currentStage.value !== 'loginRegister') return
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
    cleanupCurrentStage()
  }
  
  function chooseUsername() {
    cleanupCurrentStage()
    currentStage.value = 'chooseUsername'
    initCurrentStage()
  }

</script>

<style scoped lang="scss">
  .signin-card {
    max-width: 30rem;
  }
</style>
