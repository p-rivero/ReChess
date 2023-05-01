<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="is-flex h-100 w-100" />
  </div>
  
  <div :class="{ 'columns': !forceVertical }">
    <div
      class="column is-flex"
      :class="{ 'remove-x-spacing': forceVertical }"
    >
      <div
        v-if="showHistoryHint"
        class="history-column is-align-items-end is-justify-content-center"
      >
        <button
          class="button is-primary is-rounded mb-3 mr-2 px-1"
          @click="moveHistory?.$el.scrollIntoView()"
        >
          <div class="icon-arrow-down color-white sz-2" />
        </button>
      </div>
      
      <PlayableChessBoard
        ref="board"
        :white="white"
        :black="black"
        :invert-enemy-direction="invertEnemyDirection"
        :allow-branching="allowBranching"
        :engine-level="engineLevel"
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
    
    
    <div
      class="is-narrow is-flex pt-2"
      :class="{ 'column': !forceVertical, 'pt-0-mobile': !forceVertical }"
    >
      <EvaluationGauge
        v-if="hasGauge"
        v-show="gaugeEnabled"
        ref="gauge"
        class="mr-2 is-flex-shrink-0"
        :white-pov="true"
      />
      <div
        class="card history-card"
        :class="{ 'history-below': forceVertical }"
      >
        <div class="history-header px-2 py-1 is-flex is-align-items-center">
          <p class="is-size-4 has-text-weight-semibold mr-3">
            {{ gauge?.evalText }}
          </p>
          <p
            v-if="!gaugeEnabled && gameOverPopupShown"
            class="is-size-5"
          >
            Game Over
          </p>
          <p
            v-else-if="opponentName"
            class="is-size-5 opponent-name-text"
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
          ref="moveHistory"
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
  import { computed, ref, watch } from 'vue'
  import { debounce } from '@/utils/ts-utils'
  import { gameOverMessage } from '@/utils/chess/game-over-message'
  import { getProtochess } from '@/protochess'
  import { showPopup, showPopupImportant } from '@/components/PopupMsg/popup-manager'
  import { updateTitle } from '@/utils/web-utils'
  import EvaluationGauge from '@/components/GameUI/EvaluationGauge.vue'
  import MoveHistoryWrap from '@/components/GameUI/MoveHistoryWrap.vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import SmartCheckbox from '@/components/BasicWrappers/SmartCheckbox.vue'
  import type { MakeMoveFlag, MakeMoveWinner, MoveInfo, Player, Variant } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  const moveHistory = ref<InstanceType<typeof MoveHistoryWrap>>()
  const playerToMove = ref<Player>()
  // Only show the game over popup once
  const gameOverPopupShown = ref(false)
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
    engineLevel?: 1 | 2 | 3 | 4 | 5
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
    if (gameOverPopupShown.value) {
      updateTitle('Game over')
    } else if (currentPlayer === 'human') {
      updateTitle('Your turn')
    } else {
      updateTitle('Waiting for opponent')
    }
  })
  
  const forceVertical = computed(() => (board.value?.aspectRatio ?? 1) >= 3)
  const showHistoryHint = computed(() => (board.value?.aspectRatio ?? 1) <= 0.5)
  
  
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
    if (props.showGameOverPopup && previousState === 'playing' && !gameOverPopupShown.value) {
      showGameOverPopup(flag, winner, playerToMove)
    }
    
    previousState = 'game-over'
    // Even if the popup was not shown initially, prevent it from being shown again
    gameOverPopupShown.value = true
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
      border-bottom: 1px solid $grey-darkest;
    }
    .history {
      height: calc(100% - 3rem);
    }
  }
  
  .history-column {
    display: none;
  }
  
  @media screen and (max-width: 768px) {
    .history-card {
      width: 100%;
      .history {
        max-height: 15rem;
      }
    }
    .pt-0-mobile {
      padding-top: 0 !important;
    }
    
    .history-column {
      display: flex;
    }
  }
  
  .opponent-name-text {
    max-width: 15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .history-below {
    width: 100%;
    max-width: 50rem;
    .history {
      max-height: 15rem;
    }
  }
  
  .remove-x-spacing {
    margin-left: -1rem !important;
    margin-right: -1rem !important;
    padding-left: 0;
    padding-right: 0;
  }
</style>
