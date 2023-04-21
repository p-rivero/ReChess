<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100">
      <PlayableChessBoard
        ref="board"
        :white="white"
        :black="black"
        :invert-enemy-direction="invertEnemyDirection"
        @new-move="(from, to, promotion, result) => {
          updateResult(result)
          emit('new-move', from, to, promotion, result?.winner)
        }"
        @on-scroll="result => {
          updateResult(result)
          emit('browse-history', result?.winner)
        }"
        @player-changed="p => playerToMove = p"
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
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import { showPopupImportant } from '@/components/PopupMsg/popup-manager'
  import { getProtochess } from '@/protochess'
  import type { MakeMoveFlag, MakeMoveWinner, Player, Variant, MoveInfo } from '@/protochess/types'
  import { debounce } from '@/utils/ts-utils'
  import { updateTitle } from '@/utils/web-utils'
  import { gameOverMessage } from '@/utils/chess/game-over-message'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  const playerToMove = ref<Player>()
  // Only show the game over popup once
  let gameOverPopupShown = false
  // Only show the popup when going from 'playing' to 'game-over', not when
  // going from 'none' to 'game-over' (which happens when the page is loaded)
  let previousState: 'playing' | 'game-over' | 'none' = 'none'
  
  const props = defineProps<{
    white: 'human' | 'engine' | 'none'
    black: 'human' | 'engine' | 'none'
    hasGauge?: boolean
    invertEnemyDirection?: boolean
    updateTitle?: boolean
    showGameOverPopup?: boolean
  }>()
  
  
  const emit = defineEmits<{
    (event: 'invalid-variant'): void
    (event: 'new-move', from: [number, number], to: [number, number], promotion?: string, winner?: Player|'none'): void
    (event: 'browse-history', winner?: Player|'none'): void
    (event: 'game-over', flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player): void
  }>()
  
  defineExpose({
    async setState(variant: Variant, history: MoveInfo[] = [], fen?: string) {
      const protochess = await getProtochess()
      // Set the board state and make sure it's valid
      // Since the page has just loaded, the move history is empty
      try {
        const state = { initialState: variant, moveHistory: history, initialFen: fen }
        const result = await board.value?.setState(state)
        if (result) {
          // Game over, show the popup
          await updateResult(result)
        } else {
          // If in the middle of a game, check that the position is valid
          await protochess.validatePosition()
          await updateResult()
        }
      } catch (e) {
        console.error(e)
        emit('invalid-variant')
        return
      }
      if (props.hasGauge) {
        await updateEvaluation()
      }
    },
    playerToMove,
  })
  
  watch(playerToMove, () => {
    if (!props.updateTitle) return
    const currentPlayer = playerToMove.value === 'white' ? props.white : props.black
    if (gameOverPopupShown) {
      updateTitle('Game over')
    } else if (currentPlayer === 'human') {
      updateTitle('Your turn')
    } else {
      updateTitle('Waiting for opponent')
    }
  })
  
  
  const updateEvalDebounced = debounce(updateEvaluation, 500)
  async function updateResult(result?: {flag: MakeMoveFlag, winner: MakeMoveWinner}) {
    if (result) {
      await gameOver(result.flag, result.winner)
    } else {
      previousState = 'playing'
    }
    if (!result && props.hasGauge) {
      await updateEvalDebounced()
    }
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
    if (props.showGameOverPopup && previousState === 'playing' && !gameOverPopupShown) {
      showGameOverPopup(flag, winner, playerToMove)
    }
    
    previousState = 'game-over'
    // Even if the popup was not shown initially, prevent it from being shown again
    gameOverPopupShown = true
    updateTitle('Game over')
    emit('game-over', flag, winner, playerToMove)
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
    try {
      const mv = await protochess.getBestMoveTimeout(1)
      const player = await protochess.playerToMove()
      gauge.value?.updateEvaluation(mv.evaluation, mv.depth, player === 'black')
      board.value?.drawArrow(mv.from, mv.to, 'analysis', mv.promotion)
    } catch (e) {
      console.info('Evaluation failed:', e)
    }
  }
</script>

