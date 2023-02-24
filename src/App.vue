<template>
  <NavbarComponent />
  <div class="page-container">
    <div class="page-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
  import NavbarComponent from '@/components/Navbar/NavbarComponent.vue';
</script>


<style lang="scss" scoped>
  .page-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    // Subtract the height of the navbar from the height of the page
    min-height: calc(100vh - 4rem);
  }
  
  .page-content {
    width: 100%;
    max-width: 1250px;
    padding: 1rem;
  }
</style>
