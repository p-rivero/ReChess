<template>
  <div>
    <p>Home page</p>
    <button @click="$router.push('/play')" class="button is-primary">Go to /play</button>
    <button @click="toggleTheme" class="button">Toggle theme</button>
  </div>
</template>

<script setup lang="ts">
  function toggleTheme() {
    const oldTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = oldTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
</script>
