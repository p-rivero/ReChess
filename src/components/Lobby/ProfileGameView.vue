<template>
  <div class="is-flex is-align-items-center">
    <div class="px-2 py-2 sz-w-5 mr-3 is-flex is-flex-direction-column is-align-items-center">
      <div class="sz-3 icon-star-fill color-theme" />
      {{ stringifyDate(game.timeCreatedMs) }}
    </div>
    <div>
      <div class="is-flex is-align-items-center">
        <p class="is-size-5">
          {{ game.variantName }}
        </p>
        <ExternalLinkButton
          @click="$router.push({name: 'variant-details', params: {variantId: game.variantId}})"
        />
      </div>
      <div class="is-flex is-align-items-center">
        <p class="adjust-text">
          vs. <a @click="viewOpponent">{{ game.opponentName }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ExternalLinkButton from '@/components/BasicWrappers/ExternalLinkButton.vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import type { GameSummary } from '@/firebase/db/schema'

  const router = useRouter()
  const userStore = useUserStore()
  
  const props = defineProps<{
    game: GameSummary
  }>()
  
  async function viewOpponent() {
    const user = await userStore.getUserById(props.game.opponentId)
    if (!user) throw new Error('User not found')
    router.push({ name: 'user-profile', params: { username: user.username } })
  }
  
  function stringifyDate(dateMs: number): string {
    const date = new Date(dateMs)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  
</script>


<style scoped lang="scss">
  .rounded-corners {
    border-radius: 0.25rem;
  }
  
  .sz-w-5 {
    width: 5rem;
  }
</style>
