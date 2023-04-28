<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100" />
  </div>
  
  <div :class="{'columns': (board?.aspectRatio ?? 1) < 3}">
    <div class="column">
      <PlayableChessBoard
        ref="board"
        :white="white"
        :black="black"
        :invert-enemy-direction="invertEnemyDirection"
        :allow-branching="allowBranching"
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
    </div>
    
    
    <div class="column is-narrow is-flex">
      <EvaluationGauge
        v-if="hasGauge"
        v-show="gaugeEnabled"
        ref="gauge"
        class="mr-2"
        :white-pov="true"
      />
      <div class="card history-card">
        <div class="history-header px-2 py-1 is-flex is-align-items-center">
          <p class="is-size-4 has-text-weight-semibold mr-3">
            {{ gauge?.evalText }}
          </p>
          <p
            v-if="opponentName"
            class="is-size-5"
          >
            vs. {{ opponentName }}
          </p>
          <p class="is-size-5">
            {{ gauge?.depthText }}
          </p>
          <a
            v-if="gauge?.explainText"
            class="ml-3 is-size-5"
            @click="showPopup('Why is the game over?', gauge?.explainText ?? '', 'ok')"
          >
            Why?
          </a>
          <div
            v-else-if="hasGauge"
            class="is-flex-grow-1 is-flex is-align-items-center is-justify-content-flex-end"
          >
            <SmartCheckbox
              class="mt-1"
              text="Eval"
              :start-value="true"
              @changed="setGaugeEnabled"
            />
          </div>
        </div>

        <MoveHistoryWrap
          v-if="board?.historyRootRef"
          class="history"
          :root="board?.historyRootRef"
          :current-selection="board?.historyCurrentNodeRef"
          @node-clicked="node => board?.jumpToHistoryNode(node)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { debounce } from '@/utils/ts-utils'
  import { gameOverMessage } from '@/utils/chess/game-over-message'
  import { getProtochess } from '@/protochess'
  import { ref, watch } from 'vue'
  import { showPopup, showPopupImportant } from '@/components/PopupMsg/popup-manager'
  import { updateTitle } from '@/utils/web-utils'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import MoveHistoryWrap from '@/components/GameUI/MoveHistoryWrap.vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import type { MakeMoveFlag, MakeMoveWinner, MoveInfo, Player, Variant } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  const playerToMove = ref<Player>()
  // Only show the game over popup once
  let gameOverPopupShown = false
  // Only show the popup when going from 'playing' to 'game-over', not when
  // going from 'none' to 'game-over' (which happens when the page is loaded)
  let previousState: 'playing' | 'game-over' | 'none' = 'none'
  // Allow disabling the gauge
  const gaugeEnabled = ref(true)
  
  const props = defineProps<{
    white: 'human' | 'engine' | 'none'
    black: 'human' | 'engine' | 'none'
    hasGauge?: boolean
    invertEnemyDirection?: boolean
    updateTitle?: boolean
    showGameOverPopup?: boolean
    allowBranching?: boolean
    opponentName?: string
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
      // Initialize evaluation gauge
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
    if (!props.hasGauge || !gaugeEnabled.value) return
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
  
  function setGaugeEnabled(enabled: boolean) {
    gauge.value?.resetText(enabled)
    gaugeEnabled.value = enabled
    updateEvaluation()
  }
</script>


<style scoped lang="scss">
  @import '@/assets/style/variables.scss';
  .history-card {
    height: 100%;
    max-height: calc(100vh - 6rem);
    .history-header {
      height: 3rem;
      border-bottom: 2px solid $grey-darkest;
    }
    .history {
      height: calc(100% - 3rem);
    }
  }
</style>
