<template>
  <BoardWithGui
    :variant="undefined"
    :white="startAs === 'white' ? 'human' : otherPlayer"
    :black="startAs === 'black' ? 'human' : otherPlayer"
    :update-title="true"
  />
</template>

<script setup lang="ts">
  import BoardWithGui from '@/components/GameUI/BoardWithGui.vue'
  import { useRoute } from 'vue-router'
  import type { MoveInfo, Player } from '@/protochess/types'
  import type { CustomMoveCallback } from '@/components/ChessBoard/PlayableChessBoard.vue'
  
  const route = useRoute()
  const startAs: Player = chooseColor()
  const otherPlayer: CustomMoveCallback = getOpponentMove
  
  
  // TODO: Get game and variant using route
  
  function chooseColor(): Player {
    // TODO
    return 'white'
  }
  
  async function getOpponentMove(_playerToMove: Player): Promise<MoveInfo> {
    // TODO
    return { from: [0, 0], to: [0, 0] }
  }
  
</script>
