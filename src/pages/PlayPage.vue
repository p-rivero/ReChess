<template>
  <BoardWithGui
    :white="startAs === 'white' ? 'human' : 'engine'"
    :black="startAs === 'black' ? 'human' : 'engine'"
    :has-gauge="false" @game-over="gameOver" @player-changed="newMove"/>
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useRoute } from 'vue-router'
  import { getMessage } from '@/utils/chess/game-over-message'
  import { showPopupImportant } from '@/components/Popup/popup-manager';
  import type { MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
import { updateTitle } from '@/utils/web-utils';
  
  const route = useRoute()
  const startAs: Player = chooseColor()
  let messageShown = false
  
  // Decide which color to play as, based on the 'startAs' query parameter
  function chooseColor(): Player {
    const DEFAULT_COLOR = 'white'
    if (!route.query.startAs || typeof route.query.startAs !== 'string') {
      return DEFAULT_COLOR
    }
    if (route.query.startAs === 'white' || route.query.startAs === 'black') {
      return route.query.startAs
    }
    if (route.query.startAs === 'random') {
      return Math.random() < 0.5 ? 'white' : 'black'
    }
    // Invalid value
    return DEFAULT_COLOR
  }
  
  function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player) {
    const title =
      winner === 'white' ? 'White wins!' :
      winner === 'black' ? 'Black wins!' :
      'It\'s a Draw!'
    const message = getMessage(flag, playerToMove)
    if (messageShown) return
    showPopupImportant(title, message, 'ok')
    messageShown = true
  }
  
  function newMove(playerToMove: Player) {
    if (playerToMove === startAs) {
      updateTitle('Your turn')
    } else {
      updateTitle('Waiting for opponent')
    }
  }
  
</script>
