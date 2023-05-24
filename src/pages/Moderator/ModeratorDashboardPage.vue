<template>
  <div>
    <p class="is-size-5">
      Reported users
    </p>
  </div>
  <hr>
  <div>
    <p class="is-size-5">
      Reported variants
    </p>
  </div>
</template>


<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const router = useRouter()
  
  async function checkUserIsMod() {
    if (!authStore.loggedUser) {
      returnHome(router, 401, 'If you are a moderator, please log in to access this page.')
      return
    }
    if (!authStore.loggedUser.moderator) {
      returnHome(router, 403, 'You need to be a moderator to access this page.')
      return
    }
  }
  watch(authStore, checkUserIsMod)
  onMounted(checkUserIsMod)
  
</script>
