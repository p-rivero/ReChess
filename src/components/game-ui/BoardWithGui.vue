<template>
  <div :class="{ 'force-vertical': forceVertical }">
    <div
      class="main-container"
    >
      <div class="board-column">
        <div
          v-if="showHistoryHint"
          class="show-history-hint is-align-items-end is-justify-content-center"
        >
          <button
            class="button is-primary is-rounded mb-3 px-1"
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
          @fen-changed="fen => fenTextbox?.setText(fen)"
        />
      </div>
      
      
      <div class="gui-column">
        <div class="history-card-and-gauge is-flex mb-4">
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
              <div
                v-if="gauge?.explainText"
                class="ml-3 is-clickable"
                @click="showPopup('Why is the game over?', gauge?.explainText ?? '', 'ok')"
              >
                <div class="icon-help color-primary-strong sz-2" />
              </div>
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
              @scroll="board?.scrollMoveHistory"
            />
          </div>
        </div>
        <div v-if="hasGauge">
          <strong>FEN:</strong>
          <SmartTextInput
            ref="fenTextbox"
            placeholder="Set FEN string"
            :max-length="500"
            :select-all-on-focus="true"
            @enter-pressed="updateFen"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { debounce } from '@/helpers/ts-utils'
  import { gameOverMessage } from '@/helpers/chess/game-over-message'
  import { getProtochess } from '@/protochess'
  import { showPopup, showPopupImportant } from '@/helpers/managers/popup-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import EvaluationGauge from '@/components/game-ui/EvaluationGauge.vue'
  import MoveHistoryWrap from '@/components/game-ui/MoveHistoryWrap.vue'
  import PlayableChessBoard from '@/components/chessboard/PlayableChessBoard.vue'
  import SmartCheckbox from '@/components/basic-wrappers/SmartCheckbox.vue'
  import SmartTextInput from '../basic-wrappers/SmartTextInput.vue'
  import type { MakeMoveFlag, MakeMoveWinner, MoveInfo, Player, Variant } from '@/protochess/types'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const gauge = ref<InstanceType<typeof EvaluationGauge>>()
  const moveHistory = ref<InstanceType<typeof MoveHistoryWrap>>()
  const fenTextbox = ref<InstanceType<typeof SmartTextInput>>()
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
    async setState(variant: Variant, history: MoveInfo[] = [], fen?: string): Promise<MakeMoveWinner|undefined> {
      if (!board.value) {
        throw new Error('Board not initialized')
      }
      let winner: MakeMoveWinner | undefined
      try {
        // Set the board state and make sure it's valid
        const state = { initialState: variant, moveHistory: history, initialFen: fen }
        const result = await board.value.setState(state)
        if (result) {
          // Game over, show the popup
          await updateResult(result)
          winner = result.winner
        } else {
          // If in the middle of a game, check that the position is valid
          // validPosition() is fast, use the UI instance
          const protochess = await getProtochess('ui')
          await protochess.validatePosition()
          await updateResult()
        }
      } catch (e) {
        console.error(e)
        emit('invalid-variant')
        return
      }
      // Initialize evaluation gauge
      // This can take a while, don't await it
      if (props.hasGauge) {
        updateEvaluation()
      }
      return winner
    },
    gameOver,
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
  
  const moveListMarginRem = props.hasGauge ? 11 : 6
  const forceVertical = computed(() => (board.value?.aspectRatio ?? 1) >= 3)
  const screenInvRatio = ref(window.innerHeight / window.innerWidth)
  const showHistoryHint = computed(() => {
    const boardInvRatio = 1 / (board.value?.aspectRatio ?? 1)
    return screenInvRatio.value - boardInvRatio < 0.3
  })
  const updateHistoryHint = debounce(() => screenInvRatio.value = window.innerHeight / window.innerWidth, 100)
  onMounted(() => window.addEventListener('resize', updateHistoryHint))
  onBeforeUnmount(() => window.removeEventListener('resize', updateHistoryHint))
  
  
  const updateEvalDebounced = debounce(updateEvaluation, 500)
  async function updateResult(result?: {flag: MakeMoveFlag, winner: MakeMoveWinner}) {
    if (result) {
      await gameOver(result.flag, result.winner)
    } else {
      previousState = 'playing'
    }
    if (!result && props.hasGauge) {
      updateEvalDebounced()
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
    board.value.disableMovement()
    emit('game-over', flag, winner, playerToMove)
  }
  
  function showGameOverPopup(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player) {
    const title =
      winner === 'white' ? 'White wins!' :
      winner === 'black' ? 'Black wins!' :
      'It\'s a Draw!'
    const message = gameOverMessage(flag, winner, playerToMove)
    
    // Wait some time before showing the popup, so that the user can see the
    // final position of the game.
    setTimeout(() => {
      showPopupImportant(title, message, 'ok')
    }, 700)
  }
  
  async function updateEvaluation() {
    board.value?.clearArrows('analysis')
    if (!props.hasGauge || !gaugeEnabled.value) return
    
    const uiEngine = await getProtochess('ui')
    const searchEngine = await getProtochess('search')
    const state = await uiEngine.getState()
    const playerToMove = await uiEngine.playerToMove()
    
    try {
      await searchEngine.setState(state)
      const mv = await searchEngine.getBestMoveTimeout(1)
      gauge.value?.updateEvaluation(mv.evaluation, mv.depth, playerToMove === 'black')
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
  
  async function updateFen(fen: string) {
    try {
      await board.value?.setFen(fen)
      updateEvaluation()
    } catch (e) {
      console.warn('Invalid FEN:', e)
    }
  }
</script>


<style scoped lang="scss">
  @import '@/assets/style/variables.scss';
  
  .main-container {
    display: flex;
    justify-content: center;
  }
  .board-column {
    display: flex;
    width: 100%;
  }
  .gui-column {
    margin-left: 1rem;
  }
  
  .history-card-and-gauge {
    height: 100%;
    max-height: v-bind("`calc(100vh - ${moveListMarginRem}rem)`");
  }
  .history-card {
    .history-header {
      height: 3rem;
      border-bottom: 1px solid $grey-darkest;
    }
    .history {
      height: calc(100% - 3rem - 2px);
    }
  }
  
  .show-history-hint {
    display: none;
  }
  
  @mixin verticalLayout() {
    .main-container {
      display: block;
      margin: 0 -1rem;
      @media screen and (max-width: 320px) {
        margin: 0 0;
      }
    }
    .board-column {
      // This makes an ugly line at the right side of the board, but prevents
      // the page from scrolling horizontally for some reason.
      width: calc(100% - 2px);
    }
    .gui-column {
      margin-top: 1rem;
      margin-left: 1rem;
      margin-right: 1rem;
      @media screen and (max-width: 320px) {
        margin-left: 0;
        margin-right: 0;
      }
    }
    
    .history-card-and-gauge {
      max-height: 30rem;
    }
    
    .history-card {
      width: 100%;
      .history {
        height: 15rem;
      }
    }
    
    .show-history-hint {
      display: flex;
      margin-left: 0.25rem;
      margin-right: 0.25rem;
    }
  }
  
  @media screen and (max-width: 720px) {
    @include verticalLayout();
  }
  .force-vertical {
    @include verticalLayout();
    
    .history-card {
      max-width: 50rem;
      .history {
        max-height: 15rem;
      }
    }
  }
  
  .opponent-name-text {
    max-width: 15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
