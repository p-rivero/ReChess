<template>
  <BoardWithGui ref="board" :white="'human'" :black="'engine'" :has-gauge="false" @game-over="gameOver" />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { ref, onMounted } from 'vue'
  import { getMessage } from '@/utils/chess/game-over-message'
  import { showPopupImportant } from '@/components/Popup/popup-manager';
  import type { MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
    
  const draftStore = useVariantDraftStore()
  let messageShown = false
  
  onMounted(async () => {
    board.value?.setState(draftStore.state)
  })
  
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
</script>
