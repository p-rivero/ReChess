<template>
  <div
    v-if="user"
    class="columns"
  >
    <div class="column is-8">
      <EditableTitle
        class="mb-5"
        :edit-button-text="'Edit display name'"
        :text="user.displayName ?? ''"
        :placeholder="`@${user.username}`"
        :editable="myProfile(user)"
        :error-handler="errorHandler"
        :validator="text => text.length > 50 ? 'The display name must be at most 50 characters long' : undefined"
        @save="updateName"
      />
      <div class="is-flex is-align-items-center mb-4">
        <div class="sz-2 icon-at color-theme" />
        <p class="is-size-5 ml-2">
          {{ user.username }}
        </p>
      </div>
      <div
        v-if="myProfile(user)"
        class="is-flex is-align-items-center mb-4"
      >
        <div
          class="sz-2 color-theme"
          :class="{
            'icon-mail': user.signInProvider === 'password',
            'icon-google': user.signInProvider === 'google.com',
            'icon-github': user.signInProvider === 'github.com',
          }"
        />
        <p class="is-size-5 ml-2 mr-3">
          {{ user.email }}
        </p>
        <button
          v-if="user.signInProvider === 'password'"
          class="button ml-4"
          :class="{ 'is-loading': sendingResetPasswordEmail }"
          :disabled="sendingResetPasswordEmail"
          @click="resetPassword"
        >
          <div class="sz-icon icon-key color-theme" />
          Change password
        </button>
      </div>
      <div class="content mb-0 pt-4">
        <h4>About:</h4>
        <EditableMarkdown
          :text="user.about"
          :placeholder="'Tell us about yourself!\nYou can use **Markdown** to format your text.'"
          :editable="myProfile(user)"
          :error-handler="errorHandler"
          :validator="text => text.length > 1000 ? 'The About section must be at most 1000 characters long' : undefined"
          @save="text => { user!.about = text; userStore.storeUser(user!) }"
        />
      </div>
      
      <SmartErrorMessage
        v-show="hasError && myProfile(user)"
        class="mt-4"
        :handler="errorHandler"
      />
      
      <button
        v-if="myProfile(user)"
        class="button is-primary mt-6"
        @click="signOut"
      >
        <div class="sz-icon icon-logout color-white" />
        Sign out
      </button>
    </div>
    <div class="column is-4" />
  </div>
</template>

<script setup lang="ts">

  import { ref, watchEffect } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  
  import { AuthUser, useAuthStore } from '@/stores/auth-user'
  import { User, useUserStore } from '@/stores/user'
  import { updateTitle } from '@/utils/web-utils'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import EditableMarkdown from '@/components/BasicWrappers/EditableMarkdown.vue'
  import EditableTitle from '@/components/BasicWrappers/EditableTitle.vue'
  import SmartErrorMessage from '@/components/BasicWrappers/SmartErrorMessage.vue'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  const user = ref<User | AuthUser>()
  const hasError = ref(false)
  const sendingResetPasswordEmail = ref(false)
  
  const errorHandler = new ErrorMessageHandler(hasError)
  
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
      updateTitle(authStore.loggedUser.displayName)
      return
    }
    
    const fetchedUser = await userStore.getUserByUsername(username)
    if (!fetchedUser) {
      // User not found, redirect to home page
      router.push({ name: 'home' })
      return
    }
    user.value = fetchedUser
    updateTitle(fetchedUser.displayName)
  })
  
  function myProfile(user: User | AuthUser): user is AuthUser {
    return user.uid === authStore.loggedUser?.uid
  }
  
  
  async function updateName(name: string) {
    if (!user.value) {
      throw new Error('User is undefined')
    }
    const oldName = user.value.name
    if (!name || name === `@${user.value.username}`) {
      // No name provided, reset to default
      user.value.name = undefined
    } else {
      user.value.name = name
    }
    try {
      await userStore.storeUser(user.value)
    } catch (e) {
      console.error(e)
      user.value.name = oldName
      showPopup(
        'Cannot edit display name',
        'To prevent spam, you can only change your display name once every 60 minutes. Please try again later.',
        'ok'
      )
    }
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
      showPopup('Cannot change password at the moment', 'Please try again later.', 'ok')
    }
    sendingResetPasswordEmail.value = false
  }
  
  async function signOut() {
    showPopup('Sign out', 'Do you want to log out of your account?', 'yes-no', async () => {
      await authStore.signOut()
      router.push({ name: 'home' })
    })
  }

</script>


<style scoped lang="scss">
  .about-container{
    min-height: 5rem;
  }
</style>