<template>
  <NavbarComponent />
  <div class="page-container is-flex is-flex-direction-row is-justify-content-center">
    <div class="page-content w-100 px-4 py-4">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
  import NavbarComponent from '@/components/Navbar/NavbarComponent.vue';
</script>


<style lang="scss" scoped>
  .page-container {
    // Subtract the height of the navbar from the height of the page
    min-height: calc(100vh - 4rem);
  }
  
  .page-content {
    max-width: 1250px;
  }
</style>
