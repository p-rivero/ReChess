<template>
  <div class="columns">
    <div class="column is-8">
      <p class="is-size-2 mb-4">{{ user?.displayName }}</p>
      <div class="is-flex is-align-items-center mb-4">
        <div class="sz-2 icon-at color-theme"></div>
        <p class="is-size-5 ml-2"> {{ user?.username }} </p>
      </div>
      <div v-if="myProfile(user)" class="is-flex is-align-items-center mb-4">
        <div class="sz-2 color-theme" :class="{
          'icon-mail': user.signInProvider === 'password',
          'icon-google': user.signInProvider === 'google.com',
          'icon-github': user.signInProvider === 'github.com',
        }"></div>
        <p class="is-size-5 ml-2 mr-3"> {{ user.email }} </p>
        <button v-if="user.signInProvider === 'password'" class="button ml-4" @click="resetPassword"
          :class="{ 'is-loading': sendingResetPasswordEmail }" :disabled="sendingResetPasswordEmail"
        >
          <div class="sz-icon icon-key color-theme"></div>
          Change password
        </button>
      </div>
      <div class="content mb-0 pt-4">
        <h4>About:</h4>
        <p v-if="!user?.about" class="is-italic mb-6">No description</p>
        <div v-else class="content mb-6">
          <VueMarkdown :source="user.about" />
        </div>
      </div>
      
      <button v-if="myProfile(user)" class="button is-primary mb-4" @click="signOut">
        <div class="sz-icon icon-logout color-white"></div>
        Sign out
      </button>
    </div>
    <div class="column is-4">
      
    </div>
  </div>
</template>

<script setup lang="ts">

  import { ref, watchEffect } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { AuthUser, useAuthStore } from '@/stores/auth-user'
  import { User, useUserStore } from '@/stores/user'
  import { updateTitle } from '@/utils/web-utils'
  import VueMarkdown from 'vue-markdown-render'
  import { showPopup } from '@/components/Popup/popup-manager'
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  const user = ref<User | AuthUser>()
  const sendingResetPasswordEmail = ref(false)
  
  // When the route or logged user changes, update the user
  watchEffect(async () => {
    const username = route.params.username
    if (!username || typeof username !== 'string') {
      // Invalid username, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    if (authStore.loggedUser?.username === username) {
      // User is logged in and is viewing their own profile
      user.value = authStore.loggedUser
      updateTitle(user.value?.displayName)
      return
    }
    
    const fetchedUser = await userStore.getUserByUsername(username)
    if (!fetchedUser) {
      // User not found, redirect to home page
      router.push({ name: 'home' })
      return
    }
    user.value = fetchedUser
    updateTitle(user.value?.displayName)
  })
  
  function myProfile(user: User | AuthUser | undefined): user is AuthUser {
    if (!user) return false
    return user.uid === authStore.loggedUser?.uid
  }
  
  
  async function resetPassword() {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to reset password')
    }
    sendingResetPasswordEmail.value = true
    try {
      await authStore.sendPasswordResetEmail(authStore.loggedUser.email)
      showPopup('Change password', `We have sent ${authStore.loggedUser.email} an email to reset your password.`, 'ok')
    } catch (e) {
      console.error(e)
      showPopup('Unable to change password at the moment', 'Please try again later.', 'ok')
    }
    sendingResetPasswordEmail.value = false
  }
  
  async function signOut() {
    authStore.signOut()
    router.push({ name: 'home' })
  }

</script>


<style scoped lang="scss">
  .about-container{
    min-height: 5rem;
  }
</style>