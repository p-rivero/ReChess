<template>
  <nav class="navbar is-fixed-top has-shadow">
    <div class="navbar-brand">
      
      <div class="navbar-burger" data-target="navbarMenu" @click="navBarBurgerClick">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="navbar-end">
        <div class="navbar-item only-when-small">
          <ToggleThemeButton />
        </div>
      </div>
      <div class="navbar-end">
        <div class="navbar-item only-when-small">
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
        <div class="navbar-item only-when-big">
          <ToggleThemeButton />
        </div>
        <div class="navbar-item only-when-big">
          <AccountCard />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import AccountCard from '@/components/Navbar/AccountCard.vue'
  import ToggleThemeButton from '@/components/Navbar/ToggleThemeButton.vue';
  
  function navBarBurgerClick() {
    const navbarBurger = document.querySelector('.navbar-burger')
    const navbarMenu = document.querySelector('.navbar-menu')
    navbarBurger?.classList.toggle('is-active')
    navbarMenu?.classList.toggle('is-active')
  }
</script>

<style lang="scss" scoped>
  .navbar.has-shadow {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .navbar-burger {
    height: 4rem;
    width: 4rem;
    margin-left: 0;
    margin-right: auto;
  }
  .navbar-item img {
    max-height: 2rem;
  }
  .navbar-item {
    height: 4rem;
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
