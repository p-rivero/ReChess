<template>
  <div
    v-if="authStore.loggedUser"
    class="card-header"
    :class="{ 'is-clickable': $route.name !== 'user-profile' }"
    @click="onAccountClick"
  >
    <div class="px-3 is-align-self-center">
      <div
        class="icon-account color-theme"
        style="border-radius: 50%;"
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
  import { useAuthStore } from '@/stores/auth-user'
  import { requestSignIn } from '@/components/Auth/auth-manager'
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
  
  .icon-account {
    height: 1.8rem;
    width: 1.8rem;
  }
</style>
