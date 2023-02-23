<template>
  <nav class="navbar is-fixed-top has-shadow">
    <div class="navbar-brand">
      <a class="navbar-item" href="/">
        <img src="@/assets/img/logo.svg" alt="ReChess: Chess reinvented by you">
      </a>
      <!-- <div class="navbar-item"> -->
        <div class="navbar-burger" data-target="navbarMenu" @click="navBarBurgerClick">
          <span></span>
          <span></span>
          <span></span>
        </div>
      <!-- </div> -->
      <div class="navbar-end">
        <div class="navbar-item">
          <AccountCard class="only-when-small" />
        </div>
      </div>
    </div>

    <div id="navbarMenu" class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item" href="/">
          Home
        </a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item">
          <AccountCard class="only-when-big" />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import AccountCard from '@/components/AccountCard.vue'
  
  function navBarBurgerClick() {
    const navbarBurger = document.querySelector('.navbar-burger')
    const navbarMenu = document.querySelector('.navbar-menu')
    navbarBurger?.classList.toggle('is-active')
    navbarMenu?.classList.toggle('is-active')
  }
</script>

<style lang="scss" scoped>
  .navbar-brand {
    padding-left: 1rem;
  }
  .navbar.has-shadow {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .navbar-burger {
    height: 4rem;
    width: 4rem;
  }
  .navbar-item img {
    max-height: 2rem;
  }
  
  .only-when-small {
    @media screen and (min-width: 1024px) {
      display: none;
    }
  }
  .only-when-big {
    @media screen and (max-width: 1023px) {
      display: none;
    }
  }
</style>
