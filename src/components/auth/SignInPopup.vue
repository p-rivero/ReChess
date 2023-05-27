<template>
  <div
    ref="popup"
    class="modal"
  >
    <div
      class="modal-background"
      @click="closePopup(true)"
    />
    <div class="box modal-card scrollable signin-card">
      <LoginRegisterStage
        v-show="currentStage === 'loginRegister'"
        ref="loginRegisterStage"
        @check-verify="checkVerify"
        @choose-username="chooseUsername"
      />
        
      <ChooseUsernameStage
        v-show="currentStage === 'chooseUsername'"
        ref="chooseUsernameStage"
        @check-verify="checkVerify"
        @close-popup="closePopup"
      />
        
      <VerifyEmailStage
        v-show="currentStage === 'verifyEmail'"
        ref="verifyEmailStage"
        @close-popup="closePopup"
      />
    </div>
  </div>
</template>


<script setup lang="ts">

  import { checkEmailVerified } from '@/helpers/managers/auth-manager'
  import { ref } from 'vue'
  import ChooseUsernameStage from './ChooseUsernameStage.vue'
  import LoginRegisterStage from './LoginRegisterStage.vue'
  import VerifyEmailStage from './VerifyEmailStage.vue'
  
  const popup = ref<HTMLElement>()
  const loginRegisterStage = ref<InstanceType<typeof LoginRegisterStage>>()
  const chooseUsernameStage = ref<InstanceType<typeof ChooseUsernameStage>>()
  const verifyEmailStage = ref<InstanceType<typeof VerifyEmailStage>>()
  
    
  type Stage = 'loginRegister'|'chooseUsername'|'verifyEmail'
  const currentStage = ref<Stage>()
    
  defineExpose({
    show(stage: Stage) {
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
      chooseUsernameStage.value?.init()
      break
    case 'verifyEmail':
      verifyEmailStage.value?.init()
      break
    }
  }
  function cleanupCurrentStage() {
    switch (currentStage.value) {
    case 'loginRegister':
      loginRegisterStage.value?.cleanup()
      break
    case 'chooseUsername':
      chooseUsernameStage.value?.cleanup()
      break
    case 'verifyEmail':
      verifyEmailStage.value?.cleanup()
      break
    }
    currentStage.value = undefined
  }
  
  
  function checkVerify() {
    const isVerified = checkEmailVerified()
    if (isVerified) {
      closePopup()
    }
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
