<template>
  <p
    class="is-size-4 has-text-centered mt-2 mb-2"
  >
    Variants you have upvoted:
  </p>
  
  <div
    v-if="variantList !== 'not fetched'"
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
        You haven't upvoted any variants
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
  import { useVariantStore } from '@/stores/variant'
  import VariantCard from '@/components/variant/view/VariantCard.vue'
  import type { PublishedVariant } from '@/protochess/types'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const route = useRoute()
  
  const variantList = ref<PublishedVariant[] | 'not fetched'>('not fetched')
  
  // When the route changes, reload the variant list
  onMounted(async () => {
    const username = route.params.username
    if (!username || typeof username !== 'string') {
      returnHome(400, 'This URL seems to be incorrect.')
      return
    }
    if (username !== authStore.loggedUser?.username) {
      returnHome(403, 'You cannot see the upvotes of other users. Please make sure the URL is correct.')
      return
    }
    
    updateTitle('Your upvoted variants')

    variantList.value = await variantStore.getUpvotedVariants(authStore.loggedUser.uid)
  })
  
</script>
