<template>
  <BoardWithGui
    ref="board"
    :white="isWhite ? 'human' : 'none'"
    :black="isBlack ? 'human' : 'none'"
    :update-title="isWhite || isBlack"
    :show-game-over-popup="isWhite || isBlack"
    :opponent-name="opponentName"
    
    @new-move="newMove"
    @invalid-variant="illegalPosition"
  />
</template>

<script setup lang="ts">
  import { onUnmounted, ref, watchEffect } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import { useGameStore } from '@/stores/game'
  import { useRoute, useRouter } from 'vue-router'
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import type { Player } from '@/protochess/types'
  
  const route = useRoute()
  const router = useRouter()
  const gameStore = useGameStore()
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  // For the remote player, use 'none' and set the state manually
  const isWhite = ref(false)
  const isBlack = ref(false)
  const opponentName = ref('')
  
  // When the route changes, update the game
  watchEffect(() => {
    if (!route.params.gameId || typeof route.params.gameId !== 'string') {
      returnHome(router, 400, 'This URL seems to be incorrect.')
      return
    }
    
    gameStore.onGameChanged(game => {
      board.value?.setState(game.variant, game.moveHistory)
      isWhite.value = game.loggedUserIsWhite
      isBlack.value = game.loggedUserIsBlack
      if (!isWhite.value && !isBlack.value) {
        updateTitle(`${game.whiteName} vs ${game.blackName}`)
      } else {
        opponentName.value = isWhite.value ? game.blackName : game.whiteName
      }
    })
    
    gameStore.onGameNotExists(() => {
      returnHome(router, 404, 'We can\'t find the game you were looking for.')
    })
    
    gameStore.onInvalidVariant(() => {
      returnHome(router, 503, 'This variant seems to be invalid. It may have been uploaded \
          using an incompatible version of the site or by a malicious user. \
          \n\nPlease report this by [opening an issue on GitHub](https://github.com/p-rivero/ReChess/issues).')
    })
    
    try {
      gameStore.listenForUpdates(route.params.gameId)
    } catch (e) {
      returnHome(router, 404, 'We can\'t find the game you were looking for.')
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
