<template>
  <p
    v-if="user"
    class="is-size-4 has-text-centered mt-2 mb-2"
  >
    Variants by {{ user.displayName }}:
  </p>
  
  <div
    v-if="user"
    class="field is-grouped is-grouped-multiline is-align-items-center is-justify-content-center"
  >
    <VariantCard
      v-for="variant of variantList"
      :key="variant.uid"
      :variant="variant"
    />
    <div
      v-if="variantList.length === 0"
      class="mt-6 is-flex is-align-items-center"
    >
      <p class="is-size-5 mr-4 has-text-centered is-break-word">
        {{ user.displayName }} hasn't published any variants
      </p>
      <div class="icon-sad color-theme sz-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRoute } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { useVariantStore } from '@/stores/variant'
  import VariantCard from '@/components/variant/view/VariantCard.vue'
  import type { PublishedVariant } from '@/protochess/types'
  import type { User } from '@/stores/user'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const route = useRoute()
  
  const user = ref<User>()
  const variantList = ref<PublishedVariant[]>([])
  
  // When the route changes, reload the variant list
  onMounted(async () => {
    const username = route.params.username
    if (!username || typeof username !== 'string') {
      returnHome(400, 'This URL seems to be incorrect.')
      return
    }
    
    let loadedUser: User
    if (authStore.loggedUser?.username === username) {
      // User is logged in and is viewing their own profile
      loadedUser = authStore.loggedUser
    } else {
      // User is not logged in or is viewing another user's profile
      const fetchedUser = await userStore.getUserByUsername(username)
      if (!fetchedUser) {
        returnHome(404, 'We can\'t find the user you were looking for.')
        return
      }
      loadedUser = fetchedUser
    }
    
    updateTitle(`Variants by ${loadedUser.displayName}`)

    variantList.value = await variantStore.getVariantsFromCreator(loadedUser.uid)
    // Set user.value after variantList.value to avoid flashing the "no variants" message
    user.value = loadedUser
  })
  
</script>
