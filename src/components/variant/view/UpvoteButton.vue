<template>
  <button
    class="pr-2 button"
    @click="upvoteClicked"
  >
    <p class="mr-3">
      {{ numUpvotes }}
    </p>
    <div
      class="sz-icon color-theme"
      :class="{
        'icon-heart': !variant.loggedUserUpvoted,
        'icon-heart-fill': variant.loggedUserUpvoted,
        'animated': animateHeart,
      }"
    />
  </button>
</template>


<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { requestSignIn } from '@/helpers/managers/auth-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useVariantStore } from '@/stores/variant'
  import type { PublishedVariant } from '@/protochess/types'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const animateHeart = ref(false)
  
  const props = defineProps<{
    variant: PublishedVariant
  }>()

  const numUpvotes = computed(() => {
    if (props.variant.numUpvotes > 1000) {
      return (props.variant.numUpvotes / 1000).toFixed(1) + 'k'
    }
    return props.variant.numUpvotes
  })
  
  async function upvoteClicked() {
    if (!authStore.loggedUser) {
      requestSignIn()
      return
    }
    const variant = props.variant
    // Update the UI optimistically. If this is an upvote, animate the heart
    variant.loggedUserUpvoted = !variant.loggedUserUpvoted
    if (variant.loggedUserUpvoted) {
      variant.numUpvotes++
      authStore.loggedUser.upvotedVariants.push(variant.uid)
      animateHeart.value = true
      setTimeout(() => animateHeart.value = false, 500)
    } else {
      variant.numUpvotes--
      authStore.loggedUser.upvotedVariants = authStore.loggedUser.upvotedVariants.filter(v => v !== variant.uid)
    }
    // Update the server
    try {
      await variantStore.upvote(variant.uid, variant.loggedUserUpvoted)
    } catch (e) {
      console.error(e)
      showPopup('Cannot upvote', 'There was an error upvoting this variant. Please try again later.', 'ok')
      // Return to the previous state
      variant.loggedUserUpvoted = !variant.loggedUserUpvoted
      variant.numUpvotes += variant.loggedUserUpvoted ? 1 : -1
    }
  }
</script>


<style scoped lang="scss">
  // Animation for the heart button when it's clicked
  @keyframes heart-pulse {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
  .sz-icon.animated {
    animation: heart-pulse 0.3s;
    animation-timing-function: ease-in-out;
  }
</style>
