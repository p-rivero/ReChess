<template>
  <div
    v-if="authStore.loggedUser"
    class="card-header"
    :class="{ 'is-clickable': $route.name !== 'user-profile' }"
    @click="onAccountClick"
  >
    <div class="ml-3 mr-2 account-image-container is-align-self-center is-flex-shrink-0">
      <img
        v-if="authStore.loggedUser.profileImg"
        class="h-100 h-100 is-rounded"
        :src="authStore.loggedUser.profileImg"
        draggable="false"
        alt="Profile image"
      >
      <div
        v-else
        class="icon-account color-theme w-100 h-100"
      />
    </div>
    <p class="pl-0 card-header-title unselectable is-break-word">
      {{ authStore.loggedUser.displayName }}
    </p>
  </div>
  <button
    v-else
    class="button is-primary"
    @click="requestSignIn"
  >
    <div class="sz-icon icon-user color-white" />
    Sign in
  </button>
</template>


<script setup lang="ts">
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const router = useRouter()
    
  async function onAccountClick() {
    router.push({ name: 'user-profile', params: { username: authStore.loggedUser?.username } })
  }
</script>


<style lang="scss" scoped>

  .card-header-title {
    overflow: clip;
    max-height: 3rem;
    font-weight: 400;
  }
  
  .account-image-container {
    height: 1.8rem;
    width: 1.8rem;
    img {
      max-height: 1.8rem;
      object-fit: cover;
    }
  }
</style>
