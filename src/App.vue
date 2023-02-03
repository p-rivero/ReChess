<template>
  <div class="page-container">
    <div class="page-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
  
</script>


<style lang="scss" scoped>
  .page-container {
    display: flex;
    justify-content: center;
    height: 100vh;
  }
  
  .page-content {
    width: 100%;
    max-width: 1200px;
    padding: 1rem;
  }
</style>
