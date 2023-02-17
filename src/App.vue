<template>
  <Navbar />
  <div class="page-container">
    <div class="page-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
  import Navbar from '@/components/Navbar.vue';
</script>


<style lang="scss" scoped>
  .page-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    // Subtract the height of the navbar from the height of the page
    min-height: calc(100vh - 3.25rem);
  }
  
  .page-content {
    width: 100%;
    max-width: 1250px;
    padding: 1rem;
  }
</style>
