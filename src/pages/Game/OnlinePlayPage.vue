<template>
  <BoardWithGui
    :variant="variant"
    :white="whitePlayer"
    :black="blackPlayer"
    :update-title="true"
  />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGameStore } from '@/stores/game'
  import type { Variant } from '@/protochess/types'
  import { ref, watchEffect } from 'vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  
  const route = useRoute()
  const router = useRouter()
  const gameStore = useGameStore()
  
  const variant = ref<Variant>()
  // For the remote player, use 'none' and set the state manually
  const whitePlayer = ref<'human'|'none'>('none')
  const blackPlayer = ref<'human'|'none'>('none')
  
  // When the route changes, update the game
  watchEffect(() => {
    if (!route.params.gameId || typeof route.params.gameId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    gameStore.onGameChanged(game => {
      variant.value = game.variant
      whitePlayer.value = game.loggedUserIsWhite ? 'human' : 'none'
      blackPlayer.value = game.loggedUserIsWhite ? 'none' : 'human'
    })
    
    gameStore.onInvalidVariant(() => {
      showPopup(
        'Invalid game',
        'The variant of this game seems to be invalid, it may have been uploaded using an old version \
          of the site or by a malicious user. You were redirected to the home page.',
        'ok'
      )
      router.push({ name: 'home' })
    })
    
    try {
      gameStore.listenForUpdates(route.params.gameId)
    } catch (e) {
      // Game might not exist, redirect to home page
      router.push({ name: 'home' })
      return
    }
  })
  
</script>
