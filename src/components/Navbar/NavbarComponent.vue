<template>
  <nav class="navbar is-fixed-top">
    <div class="navbar-brand">
      
      <div class="navbar-burger ml-0 mr-auto" data-target="navbarMenu" @click="navBarBurgerClick">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-desktop">
          <button aria-label="toggle theme" class="button sz-2 icon-theme color-theme" @click="toggleTheme"></button>
        </div>
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-desktop">
          <AccountCard />
        </div>
      </div>
    </div>

    <div id="navbarMenu" class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item" href="/">
          <div class="logo"></div>
        </a>
        <a class="navbar-item" href="/">Browse</a>
        <a class="navbar-item" @click="create">Create</a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-touch">
          <button aria-label="toggle theme" class="button sz-2 icon-theme color-theme" @click="toggleTheme"></button>
        </div>
        <div class="navbar-item is-hidden-touch">
          <AccountCard />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import AccountCard from '@/components/Navbar/AccountCard.vue'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { toggleTheme } from '@/utils/theme'
  
  const authStore = useAuthStore()
  const router = useRouter()
  
  function navBarBurgerClick() {
    const navbarBurger = document.querySelector('.navbar-burger')
    const navbarMenu = document.querySelector('.navbar-menu')
    navbarBurger?.classList.toggle('is-active')
    navbarMenu?.classList.toggle('is-active')
  }
  
  
  function create() {
    if (authStore.loggedUser) {
      router.push({ name: 'edit-variant' })
    } else {
      requestSignIn()
    }
  }
</script>

<style lang="scss" scoped>
  [data-theme="light"] .navbar {
    box-shadow: 0 0.2em 0.3em rgba(0, 0, 0, 0.2);
  }
  [data-theme="dark"] .navbar {
    box-shadow: 0 0.5em 1em -0.125em rgba(0, 0, 0, 0.2), 0 0px 0 1px rgba(0, 0, 0, 0.2);
  }
  .navbar-burger {
    height: 4rem;
    width: 4rem;
  }
  .navbar-item img {
    max-height: 2rem;
  }
  .logo {
    // Prevent jump when loading the logo
    width: 10.4rem;
    height: 2rem;
    background-size: contain;
    background-repeat: no-repeat;
  }
  [data-theme="light"] .logo {
    background-image: url('@/assets/img/logo-light.svg');
  }
  [data-theme="dark"] .logo {
    background-image: url('@/assets/img/logo-dark.svg');
  }
  .navbar-item {
    height: 4rem;
  }
</style>
