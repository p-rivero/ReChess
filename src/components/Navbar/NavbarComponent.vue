<template>
  <nav class="navbar is-fixed-top">
    <div class="navbar-brand">
      <div
        ref="navbarBurger"
        class="navbar-burger ml-0 mr-auto"
        data-target="navbarMenu"
        @click="navBarBurgerClick"
      >
        <span />
        <span />
        <span />
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-desktop">
          <button
            aria-label="toggle theme"
            class="button sz-2 icon-theme color-theme"
            @click="toggleTheme"
          />
        </div>
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-desktop">
          <AccountCard />
        </div>
      </div>
    </div>

    <div
      id="navbarMenu"
      ref="navbarMenu"
      class="navbar-menu"
    >
      <div class="navbar-start">
        <a
          class="navbar-item"
          href="/"
        >
          <div class="logo" />
        </a>
        <a
          class="navbar-item"
          href="/"
          @click="hideNavBarMenu"
        >Browse</a>
        <a
          class="navbar-item"
          @click="create"
        >Create</a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item is-hidden-touch">
          <button
            aria-label="toggle theme"
            class="button sz-2 icon-theme color-theme"
            @click="toggleTheme"
          />
        </div>
        <div class="navbar-item is-hidden-touch">
          <AccountCard />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { toggleTheme } from '@/utils/theme'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRouter } from 'vue-router'
  import { useUserPrefsStore } from '@/stores/user-preferences'
  import AccountCard from '@/components/Navbar/AccountCard.vue'
  
  const authStore = useAuthStore()
  const userPrefsStore = useUserPrefsStore()
  const router = useRouter()
  const navbarBurger = ref<HTMLElement>()
  const navbarMenu = ref<HTMLElement>()
  
  function navBarBurgerClick() {
    navbarBurger.value?.classList.toggle('is-active')
    navbarMenu.value?.classList.toggle('is-active')
  }
  
  function hideNavBarMenu() {
    navbarBurger.value?.classList.remove('is-active')
    navbarMenu.value?.classList.remove('is-active')
  }
  
  
  function create() {
    hideNavBarMenu()
    if (!authStore.loggedUser) {
      requestSignIn()
    } else if (userPrefsStore.suggestUsingTemplate) {
      showPopup(
        'Create a variant from scratch',
        'Making small changes to a variant you like is much easier than creating a new one from scratch. \
        \n\n> **Tip:** Click any variant to see its details, and then select "Use as template". \
        \n\nAre you sure you want to create a new variant? \
        \n\n*If you click "Yes", this message won\'t be shown again.*',
        'yes-no',
        () => {
          userPrefsStore.suggestUsingTemplate = false
          router.push({ name: 'edit-draft' })
        }
      )
    } else {
      router.push({ name: 'edit-draft' })
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
    width: 11rem;
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
