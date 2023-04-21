<template>
  <BoardWithGui
    ref="board"
    :white="isWhite ? 'human' : 'none'"
    :black="isBlack ? 'human' : 'none'"
    :update-title="isWhite || isBlack"
    :show-game-over-popup="isWhite || isBlack"
    
    @new-move="newMove"
    @invalid-variant="illegalPosition"
  />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGameStore } from '@/stores/game'
  import type { Player } from '@/protochess/types'
  import { onUnmounted, ref, watchEffect } from 'vue'
  import { showPopup } from '@/components/PopupMsg/popup-manager'
  import { updateTitle } from '@/utils/web-utils'
  
  const route = useRoute()
  const router = useRouter()
  const gameStore = useGameStore()
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  // For the remote player, use 'none' and set the state manually
  const isWhite = ref(false)
  const isBlack = ref(false)
  
  // When the route changes, update the game
  watchEffect(() => {
    if (!route.params.gameId || typeof route.params.gameId !== 'string') {
      // Variant ID is missing, redirect to home page
      router.push({ name: 'home' })
      return
    }
    
    gameStore.onGameChanged(game => {
      board.value?.setState(game.variant, game.moveHistory)
      isWhite.value = game.loggedUserIsWhite
      isBlack.value = game.loggedUserIsBlack
      if (!isWhite.value && !isBlack.value) {
        updateTitle(`${game.whiteName} vs ${game.blackName}`)
      }
    })
    
    gameStore.onGameNotExists(() => {
      router.push({ name: 'home' })
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
    // Convert winner from Player|'none'|undefined to Player|'draw'|null
    const winner2 = (winner === 'none') ? 'draw' : winner
    // Get the player to move from the board
    const playerToMove = board.value.playerToMove
    if (!playerToMove) throw new Error('Player to move is not defined')
    try {
      await gameStore.movePiece(from, to, promotion, playerToMove, winner2)
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
