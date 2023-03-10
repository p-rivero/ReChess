<template>
  <div class="modal" ref="popup">
    <div class="modal-background" @click="closePopup"></div>
    <div class="box modal-card signin-card">
      
      <LoginRegisterStage v-show="currentStage === 'loginRegister'" ref="loginRegisterStage"
        @check-verify="checkEmailVerified" @choose-username="chooseUsername"/>
        
      <VerifyEmailStage v-show="currentStage === 'verifyEmail'" />
      
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
    
  type Stage = 'loginRegister'|'chooseUsername'|'verifyEmail'
  const currentStage = ref<Stage>()
    
  defineExpose({
    async show(stage: Stage) {
      hideCurrentStage()
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
        break
      case 'verifyEmail':
        break
    }
    // TODO
  }
  function hideCurrentStage() {
    switch (currentStage.value) {
      case 'loginRegister':
        loginRegisterStage.value?.hide()
        break
      case 'chooseUsername':
        // TODO
        break
      case 'verifyEmail':
        break
    }
    currentStage.value = undefined
  }
  
  function closePopup() {
    // Only allow closing if we're in the loginRegister stage
    if (currentStage.value !== 'loginRegister') return
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
    hideCurrentStage()
  }
  
  function chooseUsername() {
    // TODO
  }

</script>

<style scoped lang="scss">
  .signin-card {
    max-width: 30rem;
  }
</style>
