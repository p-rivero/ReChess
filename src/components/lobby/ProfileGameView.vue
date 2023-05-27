<template>
  <div class="columns is-align-items-center is-desktop mx-0">
    <div class="result-container column is-narrow pr-0 pl-2">
      <div
        class="result-icon color-theme mx-2"
        :class="{
          'icon-points-0': game.result === 'loss',
          'icon-points-half': game.result === 'draw',
          'icon-points-1': game.result === 'win',
        }"
      />
      {{ stringifyDate(game.timeCreatedMs) }}
    </div>
    
    <div class="column py-0 pr-0">
      <div class="is-flex is-align-items-center">
        <p class="is-size-5 is-break-word">
          {{ game.variantName }}
        </p>
        <ExternalLinkButton @click="viewVariant" />
      </div>
      <div class="is-flex is-align-items-center">
        <p class="adjust-text is-break-word">
          vs. <a @click="viewOpponent">{{ game.opponentName }}</a>
        </p>
      </div>
    </div>
    
    <div class="column is-narrow pl-1">
      <button
        class="button is-primary is-fullwidth"
        @click="$router.push({ name: 'play-online', params: { gameId: game.gameId } })"
      >
        <div class="sz-icon icon-eye color-white" />
        View
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import ExternalLinkButton from '@/components/basic-wrappers/ExternalLinkButton.vue'
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
  
  function viewVariant() {
    // Open the variant in a new tab
    const location = router.resolve({ name: 'variant-details', params: { variantId: props.game.variantId } })
    window.open(location.href, '_blank')
  }
  
</script>


<style scoped lang="scss">
  .rounded-corners {
    border-radius: 0.25rem;
  }
  .columns {
    .column {
      @media screen and (max-width: 1023px) {
        width: 100% !important;
        padding-left: 0.75rem !important;
        padding-right: 0.75rem !important;
      }
    }
  }
  
  .result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .result-icon {
      width: 3.5rem;
      height: 3.5rem;
    }
    @media screen and (max-width: 1023px) {
      flex-direction: row;
      padding-bottom: 0;
    }
  }
</style>