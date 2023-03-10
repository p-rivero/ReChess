<template>
  <div class="modal" ref="popup">
    <div class="modal-background" @click="closePopup"></div>
    <div class="box modal-card signin-card">
      
      <LoginRegisterStage v-show="currentStage === 'loginRegister'" ref="loginRegisterStage"/>
      
    </div>
  </div>
</template>


<script setup lang="ts">

  import { ref } from 'vue'
  import LoginRegisterStage from '@/components/Auth/LoginRegisterStage.vue'
  
  const popup = ref<HTMLElement>()
  const loginRegisterStage = ref<InstanceType<typeof LoginRegisterStage>>()
    
  type Stage = 'loginRegister'|'chooseUsername'|'verifyEmail'
  const currentStage = ref<Stage>()
    
  defineExpose({
    async show(stage: Stage) {
      if (currentStage.value) throw new Error('Popup already open')
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
    popup.value?.classList.remove('is-active')
    document.documentElement.classList.remove('is-clipped')
    hideCurrentStage()
  }

</script>

<style scoped lang="scss">
  .signin-card {
    max-width: 30rem;
  }
</style>
