<template>
  <BoardWithGui
    ref="board"
    :variant="variant"
    :white="whitePlayer"
    :black="blackPlayer"
    :update-title="true"
    
    @new-move="newMove"
    @invalid-variant="illegalPosition"
  />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGameStore, type Game } from '@/stores/game'
  import type { Player, Variant } from '@/protochess/types'
  import { onUnmounted, ref, watchEffect } from 'vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  
  const route = useRoute()
  const router = useRouter()
  const gameStore = useGameStore()
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  const variant = ref<Variant>()
  // For the remote player, use 'none' and set the state manually
  const whitePlayer = ref<'human'|'none'>('none')
  const blackPlayer = ref<'human'|'none'>('none')
  
  let currentGame: Game | null = null
  
  // When the route changes, update the game
  watchEffect(() => {
    if (!route.params.gameId || typeof route.params.gameId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    gameStore.onGameChanged(game => {
      console.log('Game changed', game)
      currentGame = game
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
  
  onUnmounted(() => {
    gameStore.removeListeners()
  })
  
  
  async function newMove(from: [number, number], to: [number, number], promotion?: string, winner?: Player|'none') {
    // Error checking
    if (!board.value) throw new Error('Board is not defined')
    if (!currentGame) throw new Error('Game must be set before sending a move')
    // Convert winner from Player|'none'|undefined to Player|'draw'|null
    const winner2 = (winner === 'none') ? 'draw' : (winner ?? null)
    // Get the player to move from the board
    const playerToMove = board.value.playerToMove
    try {
      await gameStore.movePiece(currentGame, from, to, promotion, playerToMove, winner2)
    } catch (e) {
      console.error(e)
      showPopup(
        'Error',
        'An error occurred while trying to send this move to the server. Please **reload the page** and try again.',
        'ok'
      )
    }
  }
  
  function illegalPosition() {
    console.log('Illegal position detected!')
  }
  
</script>
