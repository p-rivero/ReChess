<template>
  <SignInPopup ref="signInPopup" />
  <PopupMessage ref="messagePopup" />
  
  <NavbarComponent />
  <div class="page-container is-flex is-flex-direction-row is-justify-content-center">
    <div class="page-content w-100 px-4 py-4">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
  import NavbarComponent from '@/components/Navbar/NavbarComponent.vue'
  import { ref, onMounted } from 'vue'
  import SignInPopup from '@/components/Popup/SignInPopup.vue'
  import PopupMessage from '@/components/Popup/PopupMessage.vue'
  import { setSignInPopup, signInRefresh } from '@/components/Auth/auth-manager'
  import { setMessagePopup } from '@/components/Popup/popup-manager'
  
  const signInPopup = ref<InstanceType<typeof SignInPopup>>()
  const messagePopup = ref<InstanceType<typeof PopupMessage>>()
  
  setSignInPopup(signInPopup)
  setMessagePopup(messagePopup)
  
  onMounted(() => {
    signInRefresh()
  })
  
</script>


<style lang="scss" scoped>
  .page-container {
    // Subtract the height of the navbar from the height of the page
    min-height: calc(100vh - 4rem);
  }
  
  .page-content {
    max-width: 1250px;
  }
</style>
