<template>
  <a class="card-header" @click="onAccountClick">
    <span class="card-header-icon">
      <img class="account-icon" src="@/assets/account.png" />
    </span>
    <p class="card-header-title">
      My user name
    </p>
  </a>
</template>


<script setup lang="ts">
  async function onAccountClick() {
    console.log('Account clicked')
  }
</script>


<style lang="scss" scoped>
  .card-header {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .account-icon {
    background-size: 100%;
    color: red;
    max-width: 2rem;
    max-height: 2rem;
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
