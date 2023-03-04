<template>
  <a v-if="true" class="card-header" @click="onAccountClick">
    <span class="card-header-icon py-0 pl-3 pr-0">
      <div class="account-icon sz-2 icon-account color-theme" style="border-radius: 50%;"></div>
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
  
  async function onAccountClick() {
    console.log('Account clicked')
  }
  
  async function onSignUpClick() {
    console.log('Sign up clicked')
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
