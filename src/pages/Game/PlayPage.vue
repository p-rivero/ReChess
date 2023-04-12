<template>
  <BoardWithGui
    :white="startAs === 'white' ? 'human' : otherPlayer"
    :black="startAs === 'black' ? 'human' : otherPlayer"
    :has-gauge="false"
    :invert-enemy-direction="otherPlayer === 'human'"
    @game-over="gameOver"
    @player-changed="newMove"
  />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useRoute } from 'vue-router'
  import { getMessage } from '@/utils/chess/game-over-message'
  import { showPopupImportant } from '@/components/PopupMsg/popup-manager'
  import type { MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
  import { updateTitle } from '@/utils/web-utils'
  
  const route = useRoute()
  const startAs: Player = chooseColor()
  const otherPlayer = getOpponent()
  let messageShown = false
  
  // Decide which color to play as, based on the 'startAs' query parameter
  function chooseColor(): Player {
    const DEFAULT_COLOR = 'white'
    if (route.query.startAs === 'white' || route.query.startAs === 'black') {
      return route.query.startAs
    }
    if (route.query.startAs === 'random') {
      return Math.random() < 0.5 ? 'white' : 'black'
    }
    // Invalid value
    return DEFAULT_COLOR
  }
  
  // Get the opponent
  function getOpponent(): 'human' | 'engine' {
    if (route.query.mode === 'otb') {
      return 'human'
    } else {
      return 'engine'
    }
    // TODO: Add online opponent
  }
  
  function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player) {
    const title =
      winner === 'white' ? 'White wins!' :
      winner === 'black' ? 'Black wins!' :
      'It\'s a Draw!'
    const message = getMessage(flag, playerToMove)
    
    // Wait some time before showing the popup, so that the user can see the
    // final position of the game.
    if (messageShown) return
    messageShown = true
    setTimeout(() => {
      showPopupImportant(title, message, 'ok')
    }, 700)
  }
  
  function newMove(playerToMove: Player) {
    if (playerToMove === startAs) {
      updateTitle('Your turn')
    } else {
      updateTitle('Waiting for opponent')
    }
  }
  
</script>
