<template>
  <div
    v-if="authStore.loggedUser"
    class="card-header"
    :class="{ 'is-clickable': $route.name !== 'user-profile' }"
    @click="onAccountClick"
  >
    <div class="pl-3 pr-0 is-align-self-center">
      <div
        class="account-icon sz-2 icon-account color-theme"
        style="border-radius: 50%;"
      />
    </div>
    <p class="card-header-title unselectable">
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
    // Don't use more than 1 line for the account name
    white-space: nowrap;
    overflow: hidden;
    max-width: 400px;
    font-weight: 400;
  }
  
  .loading-placeholder {
    width: 6rem;
  }
</style>
