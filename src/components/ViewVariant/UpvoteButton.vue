<template>
  <button
    class="heart-button button"
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
  import type { PublishedVariantGui } from '@/protochess/types'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { requestSignIn } from '@/components/Auth/auth-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useVariantStore } from '@/stores/variant'
  
  const variantStore = useVariantStore()
  const authStore = useAuthStore()
  const animateHeart = ref(false)
  
  const props = defineProps<{
    variant: PublishedVariantGui
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
    variant.numUpvotes += variant.loggedUserUpvoted ? 1 : -1
    if (variant.loggedUserUpvoted) {
      animateHeart.value = true
      setTimeout(() => animateHeart.value = false, 500)
    }
    // Update the server
    try {
      await variantStore.upvote(variant.uid, variant.loggedUserUpvoted)
    } catch (e: any) {
      console.error(e)
      showPopup('Cannot upvote', 'There was an error upvoting this variant. Please try again later.', 'ok')
      // Return to the previous state
      variant.loggedUserUpvoted = !variant.loggedUserUpvoted
      variant.numUpvotes += variant.loggedUserUpvoted ? 1 : -1
    }
  }
</script>


<style scoped lang="scss">
  .heart-button {
    padding-right: 0.5rem;
  }
  
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
