<template>
  <a v-if="false" class="card-header" @click="onAccountClick">
    <span class="card-header-icon">
      <div class="account-icon" :class="{
        'dark-account-icon': themeStore.currentTheme === 'dark',
      }"></div>
    </span>
    <p class="card-header-title">
      My user name
    </p>
  </a>
  <button v-else class="button is-primary" @click="onSignUpClick">
    <strong>Sign up</strong>
  </button>
</template>


<script setup lang="ts">
  import { useThemeStore } from '@/stores/theme';
  const themeStore = useThemeStore();
  
  async function onAccountClick() {
    console.log('Account clicked')
  }
  
  async function onSignUpClick() {
    console.log('Sign up clicked')
  }
</script>


<style lang="scss" scoped>
  .card-header {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .account-icon {
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    background-image: url("@/assets/img/account/account-light.svg");
  }
  .dark-account-icon {
    background-image: url("@/assets/img/account/account-dark.svg");
  }

  .card-header-icon {
    padding: 0;
    padding-left: 12px;
  }
  .card-header-title {
    // Don't use more than 1 line for the account name
    white-space: nowrap;
    overflow: hidden;
    max-width: 400px;
  }
</style>
