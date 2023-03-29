<template>
  <div
    v-if="user"
    class="columns"
  >
    <div class="column is-8">
      <div class="is-flex is-align-items-center mb-5">
        <div
          class="mr-4 profile-image-container is-flex-shrink-0 is-flex-grow-0"
          :class="{
            'editable': myProfile(user),
            'force-show-overlay': imageSelectPopup?.loading
          }"
          @click="imageClicked"
        >
          <img
            v-if="user.profileImg"
            class="h-100 h-100"
            :src="user.profileImg"
            draggable="false"
            alt="Profile image"
          >
          <div
            v-else
            class="icon-account color-theme w-100 h-100"
          />
          <div
            v-if="myProfile(user)"
            class="overlay is-flex is-align-items-center is-justify-content-center"
          >
            <div
              v-if="imageSelectPopup?.loading"
              class="button is-loading is-large is-transparent"
            />
            <div
              v-else
              class="icon-edit color-white sz-3"
            />
          </div>
        </div>
        
        <EditableTitle
          class="w-100 is-flex-shrink-1 is-small"
          :edit-button-text="'Edit name'"
          :text="user.displayName ?? ''"
          :placeholder="`@${user.username}`"
          :editable="myProfile(user)"
          :start-edit-callback="startNameEdit"
          :error-handler="errorHandler"
          :validator="text => text.length > 50 ? 'The display name must be at most 50 characters long' : undefined"
          @save="updateName"
        />
      </div>
      <div class="is-flex is-align-items-center mb-4">
        <div class="sz-2 icon-at color-theme is-flex-shrink-0" />
        <p class="is-size-5 ml-2 is-break-word">
          {{ user.username }}
        </p>
      </div>
      <div
        v-if="myProfile(user)"
        class="is-flex is-align-items-center mb-4"
      >
        <div
          class="sz-2 color-theme is-flex-shrink-0"
          :class="{
            'icon-mail': user.signInProvider === 'password',
            'icon-google': user.signInProvider === 'google.com',
            'icon-github': user.signInProvider === 'github.com',
          }"
        />
        <div class="columns mx-0 my-0 is-align-items-center">
          <div class="column px-0 py-0">
            <p class="is-size-5 ml-2 mr-3 is-break-word">
              {{ user.email }}
            </p>
          </div>
          <div class="column px-0 py-0 is-narrow">
            <button
              v-if="user.signInProvider === 'password'"
              class="button ml-2"
              :class="{ 'is-loading': sendingResetPasswordEmail }"
              :disabled="sendingResetPasswordEmail"
              @click="resetPassword"
            >
              <div class="sz-icon icon-key color-theme" />
              Change password
            </button>
          </div>
        </div>
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
      
      <div
        v-if="myProfile(user)"
        class="is-flex"
      >
        <div
          class="is-flex is-align-items-center mt-6 pl-2 pr-1 py-2 is-clickable danger-dropdown-container"
          @click="showDangerZone = !showDangerZone"
        >
          <p class="has-text-danger unselectable">
            Danger zone
          </p>
          <div
            class="ml-1 sz-chevron color-danger"
            :class="{ 'icon-chevron-down': !showDangerZone, 'icon-chevron-up': showDangerZone }"
          />
        </div>
      </div>
      
      <div
        v-show="showDangerZone && myProfile(user)"
        class="mt-2 danger-zone-container"
      >
        <button
          class="button is-danger"
          @click="deleteAccount"
        >
          <div class="sz-icon icon-trash color-white" />
          Delete account
        </button>
      </div>
    </div>
    <div class="column is-4" />
  </div>
  <ImageSelectPopup
    ref="imageSelectPopup"
    :uploaded-image-width="256"
    :show-delete-button="() => user?.profileImg !== undefined"
    :cache="PROFILE_IMG_CACHE"
    @image-uploaded="setProfileImage"
    @remove-image="setProfileImage(undefined)"
    @upload-error="showPopup(
      'Could not upload image',
      'Make sure you uploaded a valid image file and the file size is **200kB** or less.',
      'ok'
    )"
  />
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
  import ImageSelectPopup from '@/components/ImageSelect/ImageSelectPopup.vue'
  import { ErrorMessageHandler } from '@/utils/errors/error-message-handler'
  import { Timestamp } from '@firebase/firestore'
  
  // Cache profile images for 1 hour to reduce network requests at the cost of a slightly outdated image
  const PROFILE_IMG_CACHE = 'public, max-age=3600' as const
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  const user = ref<User | AuthUser>()
  const hasError = ref(false)
  const showDangerZone = ref(false)
  const sendingResetPasswordEmail = ref(false)
  const imageSelectPopup = ref<InstanceType<typeof ImageSelectPopup>>()
  
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
    return authStore.loggedUser !== null && user.uid === authStore.loggedUser.uid
  }
  
  function startNameEdit(): boolean {
    if (!user.value) {
      throw new Error('User is undefined')
    }
    if (!user.value.renameAllowedAt) {
      // User has never changed their name, continue with the edit
      return true
    }
    if (Date.now() < user.value.renameAllowedAt.toMillis()) {
      showPopup(
        'Cannot edit display name',
        'To prevent spam, you can only change your display name once every **5 minutes**. Please try again later.',
        'ok'
      )
      return false
    }
    return true
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
    if (user.value.name === oldName) {
      // Name has not changed, nothing to do
      return
    }
    user.value.updateDisplayName()
    
    try {
      await userStore.storeUser(user.value)
      // Update the timestamp to prevent 2 consecutive edits
      user.value.renameAllowedAt = Timestamp.fromMillis(Date.now() + 30 * 60 * 1000)
    } catch (e) {
      console.error(e)
      user.value.name = oldName
      showPopup(
        'Cannot edit display name',
        'There has been an unexpected error. Please try again later.',
        'ok'
      )
    }
  }
  
  async function imageClicked() {
    if (!user.value || !myProfile(user.value)) {
      return
    }
    imageSelectPopup.value?.show(`profile-images/${user.value.uid}`)
  }
  async function setProfileImage(url: string | undefined) {
    if (!user.value) {
      throw new Error('User is undefined')
    }
    user.value.profileImg = url
    await userStore.storeUser(user.value)
  }
  
  async function deleteAccount() {
    showPopup(
      'Delete account',
      '**Your profile data will be deleted immediately, this action cannot be undone.** \
      \n\nThe variants you have created will still be available for other players, but your name will \
      be removed from them (anonymous author). \
      \n\nYour username `' + authStore.loggedUser?.username + '` will become available for anyone to use. \
      \n\nAre you sure you want to delete your account?',
      'yes-no',
      deleteAccountConfirmed
    )
  }
  async function deleteAccountConfirmed() {
    try {
      await authStore.deleteUser()
      router.push({ name: 'home' })
      showPopup(
        'Account deleted',
        'Your account has been deleted successfully. We are sorry to see you go! \
        \n\nIf you have any feedback, please [open an issue on GitHub](https://github.com/p-rivero/ReChess/issues).',
        'ok'
      )
    } catch (e) {
      console.error(e)
      showPopup(
        'Account deletion failed',
        'This usually happens because it\'s been some time since you last logged in. \
        \n\nPlease sign out and in again, and try again. If the problem persists, please \
        [open an issue on GitHub](https://github.com/p-rivero/ReChess/issues). \
        \n\nDo you want to log out now?',
        'yes-no',
        async () => {
          await authStore.signOut()
          router.push({ name: 'home' })
        }
      )
      return
    }
  }
  
  async function resetPassword() {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to reset password')
    }
    sendingResetPasswordEmail.value = true
    try {
      await authStore.sendPasswordResetEmail(authStore.loggedUser.email)
      showPopup('Change password', `We have sent \`${authStore.loggedUser.email}\` an email to reset your password.`, 'ok')
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
  @import '@/assets/style/variables.scss';
  .sz-chevron{
    width: 1.5rem;
    height: 1.5rem;
  }
  .danger-dropdown-container {
    &:hover {
      background-color: rgba($danger, 0.1);
      border-radius: $radius;
    }
  }
  .danger-zone-container{
    border-left: 1px solid $danger;
    border-width: 0.2rem;
    padding: 1rem;
  }
  
  .profile-image-container {
    width: 7rem;
    height: 7rem;
    @media screen and (max-width: 768px) {
      width: 5rem;
      height: 5rem;
    }
    position: relative;
    margin-left: -0.4rem;
    img {
      border-radius: 50%;
      object-fit: cover;
    }
  }
  
  .button.is-transparent {
    background-color: transparent;
    border: none;
    font-size: 3rem;
    &::after {
      border: 4px solid hsl(0, 0%, 86%);
      border-right-color: transparent;
      border-bottom-color: transparent;
    }
  }
  
  .profile-image-container.editable {
    cursor: pointer;
    
    .overlay {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.6);
      opacity: 0;
      transition: all 0.1s;
      -webkit-transition: all 0.1s;
    }
    
    &:hover .overlay, &.force-show-overlay .overlay {
      opacity: 1;
    }
  }
  
</style>