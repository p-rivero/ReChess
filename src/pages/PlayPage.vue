<template>
  <BoardWithGui ref="board" :white="'human'" :black="'engine'" :has-gauge="false" @game-over="gameOver" />
  <PopupMessage ref="popup" />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import PopupMessage from '@/components/Popup/PopupMessage.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { ref, onMounted } from 'vue'
  import type { MakeMoveFlag, MakeMoveWinner } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  const popup = ref<InstanceType<typeof PopupMessage>>()
    
  const draftStore = useVariantDraftStore()
  
  onMounted(async () => {
    board.value?.setState(draftStore.state)
  })
  
  function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner) {
    const title =
      winner === 'White' ? 'White wins!' :
      winner === 'Black' ? 'Black wins!' :
      'It\'s a Draw!'
    const message =
      flag === 'Checkmate' ? 'Checkmate: The player to move has no legal moves and is in check.' :
      flag === 'Stalemate' ? 'Stalemate: The player to move has no legal moves.' :
      flag === 'LeaderCaptured' ? 'The leader of the player to move has been captured or has exploded.' :
      flag === 'AllPiecesCaptured' ? 'All the pieces of the player to move have been captured.' :
      flag === 'PieceInWinSquare' ? 'One of the pieces has reached a winning square.' :
      flag === 'CheckLimit' ? 'The player to move has been in check too many times.' :
      flag === 'Repetition' ? 'The same position has been repeated too many times.' : ''
    
    popup.value?.showImportant(title, message, 'ok')
  }
</script>
