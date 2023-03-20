<template>
  <!-- USER PROFILE PAGE -->
  <div>
    {{ user?.displayName }}
    <div v-if="isMyProfile" @click="authStore.signOut">
      Log out
    </div>
  </div>
</template>

<script setup lang="ts">

  import { computed, ref, watchEffect, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { AuthUser, useAuthStore } from '@/stores/auth-user'
  import { User, useUserStore } from '@/stores/user'
  import { updateTitle } from '@/utils/web-utils'
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  const isMyProfile = computed(() => user.value?.uid === authStore.loggedUser?.uid)
  // If isMyProfile is true, user will be an AuthUser
  const user = ref<User | AuthUser>()
  
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

</script>