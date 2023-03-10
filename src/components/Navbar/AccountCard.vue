<template>
  <a v-if="authStore.user" class="card-header" @click="onAccountClick">
    <span class="card-header-icon py-0 pl-3 pr-0">
      <div class="account-icon sz-2 icon-account color-theme" style="border-radius: 50%;"></div>
    </span>
    <p class="card-header-title">
      {{ authStore.user!.name }}
    </p>
  </a>
  <button v-else class="button is-primary" @click="onSignInClick">
    <p>Sign in</p>
  </button>
</template>


<script setup lang="ts">
  import { useAuthStore } from '@/stores/auth-user'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  const authStore = useAuthStore()
    
  async function onAccountClick() {
    authStore.signOut()
  }
  
  async function onSignInClick() {
    await requestSignIn()
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
</style>
