<template>
  <SignInPopup ref="signInPopup" />
  <PopupMessage ref="messagePopup" />
  
  <NavbarComponent />
  <div class="page-container is-flex is-flex-direction-row is-justify-content-center">
    <div class="page-content w-100 mx-4 my-4">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { setMessagePopup } from '@/helpers/managers/popup-manager'
  import { setSignInPopup, signInRefresh } from '@/helpers/managers/auth-manager'
  import NavbarComponent from '@/components/navbar/NavbarComponent.vue'
  import PopupMessage from '@/components/popup-message/PopupMessage.vue'
  import SignInPopup from '@/components/auth/SignInPopup.vue'
  
  const signInPopup = ref<InstanceType<typeof SignInPopup>>()
  const messagePopup = ref<InstanceType<typeof PopupMessage>>()
  
  setSignInPopup(signInPopup)
  setMessagePopup(messagePopup)
  
  onMounted(() => {
    signInRefresh()
  })
  
</script>


<style scoped lang="scss">
  .page-container {
    // Subtract the height of the navbar from the height of the page
    min-height: calc(100vh - 4rem);
  }
  
  .page-content {
    max-width: 1250px;
  }
</style>
