<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100">
      <PlayableChessBoard
        ref="board"
        :white="white"
        :black="black"
        :invert-enemy-direction="invertEnemyDirection"
        @piece-moved="pieceMoved"
        @player-changed="updatePlayerToMove"
      />
      <EvaluationGauge
        v-if="hasGauge"
        ref="gauge"
        class="ml-2"
        :white-pov="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import type { CustomMoveCallback } from '@/components/ChessBoard/PlayableChessBoard.vue'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import { showPopupImportant } from '@/components/PopupMsg/popup-manager'
  import { getProtochess } from '@/protochess'
  import type { MakeMoveFlag, MakeMoveWinner, Player, Variant } from '@/protochess/types'
  import { debounce } from '@/utils/ts-utils'
  import { updateTitle } from '@/utils/web-utils'
  import { gameOverMessage } from '@/utils/chess/game-over-message'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  let gameOverPopupShown = false
  
  const props = defineProps<{
    variant: Variant | undefined
    white: 'human' | 'engine' | CustomMoveCallback
    black: 'human' | 'engine' | CustomMoveCallback
    hasGauge?: boolean
    invertEnemyDirection?: boolean
    updateTitle?: boolean
    showGameOverPopup?: boolean
  }>()
  
  
  const emit = defineEmits<{
    (event: 'invalid-variant'): void
    (event: 'piece-move', from?: [number, number], to?: [number, number]): void
    (event: 'game-over', flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player): void
  }>()
  
  
  // Reload the variant when needed
  watch(props, async () => {
    if (!props.variant) return
    const protochess = await getProtochess()
    // Set the board state and make sure it's valid
    // Since the page has just loaded, the move history is empty
    await board.value?.setState(props.variant, [])
    try {
      await protochess.validatePosition()
    } catch (e) {
      console.error(e)
      emit('invalid-variant')
      return
    }
    gameOverPopupShown = false
    if (props.hasGauge) {
      await updateEvaluation()
    }
  })
  
  
  const updateEvalDebounced = debounce(updateEvaluation, 500)
  async function pieceMoved(from?: [number, number], to?: [number, number], result?: {flag: MakeMoveFlag, winner: MakeMoveWinner}) {
    if (result !== undefined) {
      await gameOver(result.flag, result.winner)
    }
    if (!result && props.hasGauge) {
      await updateEvalDebounced()
    }
    emit ('piece-move', from, to)
  }
  
  async function gameOver(flag: MakeMoveFlag, winner: MakeMoveWinner) {
    if (flag === 'Ok' || flag === 'IllegalMove') {
      throw new Error('Invalid flag emitted from PlayableChessBoard: ' + flag)
    }
    if (!board.value) {
      throw new Error('Reference to board is undefined')
    }
    const playerToMove = await board.value.playerToMove()
    board.value.clearArrows('analysis')
    if (props.hasGauge) {
      gauge.value?.gameOver(flag, winner, playerToMove)
    }
    emit('game-over', flag, winner, playerToMove)
    if (props.showGameOverPopup && !gameOverPopupShown) {
      showGameOverPopup(flag, winner, playerToMove)
      gameOverPopupShown = true
    }
  }
  function showGameOverPopup(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player) {
    const title =
      winner === 'white' ? 'White wins!' :
      winner === 'black' ? 'Black wins!' :
      'It\'s a Draw!'
    const message = gameOverMessage(flag, playerToMove)
    
    // Wait some time before showing the popup, so that the user can see the
    // final position of the game.
    setTimeout(() => {
      showPopupImportant(title, message, 'ok')
    }, 700)
  }
  
  async function updateEvaluation() {
    board.value?.clearArrows('analysis')
    const protochess = await getProtochess()
    const mv = await protochess.getBestMoveTimeout(1)
    const player = await protochess.playerToMove()
    
    gauge.value?.updateEvaluation(mv.evaluation, mv.depth, player === 'black')
    board.value?.drawArrow(mv.from, mv.to, 'analysis', mv.promotion)
  }
  
  function updatePlayerToMove(playerToMove: Player) {
    if (!props.updateTitle) return
    const currentPlayer = playerToMove === 'white' ? props.white : props.black
    if (currentPlayer === 'human') {
      updateTitle('Your turn')
    } else {
      updateTitle('Waiting for opponent')
    }
  }
</script>

