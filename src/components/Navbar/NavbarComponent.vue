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
          <button class="button sz-2 icon-theme color-theme" @click="toggleTheme"></button>
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
          <img src="@/assets/img/logo.svg" alt="ReChess: Chess reinvented by you">
        </a>
        <a class="navbar-item" href="/">Browse</a>
        <a class="navbar-item" href="/edit">Create</a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-touch">
          <button class="button sz-2 icon-theme color-theme" @click="toggleTheme"></button>
        </div>
        <div class="navbar-item is-hidden-touch">
          <AccountCard />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import AccountCard from '@/components/Navbar/AccountCard.vue'
  import { toggleTheme } from '@/utils/theme'
  
  function navBarBurgerClick() {
    const navbarBurger = document.querySelector('.navbar-burger')
    const navbarMenu = document.querySelector('.navbar-menu')
    navbarBurger?.classList.toggle('is-active')
    navbarMenu?.classList.toggle('is-active')
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
  .navbar-item {
    height: 4rem;
  }
</style>
