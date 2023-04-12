<template>
  <p class="is-size-2 mb-2 is-break-word">
    Play {{ variant?.displayName }}
  </p>
  
  <PlayPopup ref="playPopup" />
</template>


<script setup lang="ts">
  import { ref, watchEffect } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  
  import { useVariantStore } from '@/stores/variant'
  import { useUserStore } from '@/stores/user'
  import type { PublishedVariant } from '@/protochess/types'
  import PlayPopup from '@/components/GameUI/PlayPopup.vue'
  import { updateTitle } from '@/utils/web-utils'
  

  const router = useRouter()
  const route = useRoute()
  const variantStore = useVariantStore()
  const userStore = useUserStore()
  
  const variant = ref<PublishedVariant>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
    
  watchEffect(async () => {
    if (!route.params.variantId || typeof route.params.variantId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    // Get variant info from the server
    const newVariant = await variantStore.getVariant(route.params.variantId)
    if (!newVariant) {
      // Variant ID is incorrect (or the uploader of this variant is malicious), redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    variant.value = newVariant
    updateTitle('Play ' + newVariant.displayName)
  })
  
  async function userClicked(userId: string) {
    // Get the username of the creator
    const user = await userStore.getUserById(userId)
    if (!user) {
      throw new Error('Could not find user with id ' + userId)
    }
    router.push({ name: 'user-profile', params: { username: user.username } })
  }
  
</script>

<style scoped lang="scss">


</style>
