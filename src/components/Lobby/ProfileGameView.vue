<template>
  <div class="is-flex is-align-items-center">
    <div class="px-2 py-2 sz-w-5 mr-3 is-flex is-flex-direction-column is-align-items-center">
      <div class="sz-3 icon-star-fill color-theme" />
      {{ stringifyDate(game.createdAt) }}
    </div>
    <div>
      <div class="is-flex is-align-items-center">
        <p class="is-size-5">
          {{ game.variant.displayName }}
        </p>
        <ExternalLinkButton
          @click="$router.push({name: 'variant-details', params: {variantId: game.variant.uid}})"
        />
      </div>
      <div class="is-flex is-align-items-center">
        <p class="adjust-text">
          vs. <a @click="viewUser">{{ opponent.name }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Game } from '@/stores/game'
  import ExternalLinkButton from '@/components/BasicWrappers/ExternalLinkButton.vue'
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'

  const router = useRouter()
  const userStore = useUserStore()
  
  const props = defineProps<{
    game: Game
    viewingUserId: string
  }>()
  
  const opponent = computed(() => {
    if (props.game.whiteId === props.viewingUserId) {
      return { name: props.game.blackName, id: props.game.blackId }
    } else {
      return { name: props.game.whiteName, id: props.game.whiteId }
    }
  })
  
  async function viewUser() {
    const user = await userStore.getUserById(opponent.value.id)
    if (!user) throw new Error('User not found')
    router.push({ name: 'user-profile', params: { username: user.username } })
  }
  
  function stringifyDate(date: Date): string {
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
