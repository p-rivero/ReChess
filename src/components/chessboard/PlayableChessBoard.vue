<!--
  This component is built on top of ViewableChessBoard and is meant for playable boards where the user controls between 0 and 2 players.
  It allows using the scroll wheel to rewind the game.
  It uses the Protochess engine to restrict the user's moves to valid ones.
  Note that, since the Protochess object is shared, at any given time there can only be 1 instance of PlayableChessBoard.
-->


<template>
  <div class="w-100">
    <div class="board-container">
      <ViewableChessBoard
        ref="board"
        class="board"
        max-height="inherit"
        :white-pov="whitePov"
        :view-only="false"
        :show-coordinates="true"
        :capture-wheel-events="true"
        :invert-enemy-direction="invertEnemyDirection"
        :cursor-pointer="cursorPointer"
        @user-moved="userMovedCallback"
        @wheel="onWheel"
      />
      <PromotionPopup ref="promotionPopup" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { MoveHistoryManager, type MoveHistoryQueryResult, type MoveTreeNode } from '@/helpers/managers/move-history-manager'
  import { computed, nextTick, ref } from 'vue'
  import { getProtochess } from '@/protochess'
  import PromotionPopup from '@/components/game-ui/PromotionPopup.vue'
  import ViewableChessBoard from './ViewableChessBoard.vue'
  import type { MakeMoveFlag, MakeMoveResult, MakeMoveWinner, MoveInfo, Player, StateDiff, VariantGameState } from '@/protochess/types'
  
  // If the user navigates the history while the engine is thinking, the found move is stored here until it can be played
  let engineStoredMove: MoveInfo|undefined = undefined
  
  const props = defineProps<{
    white: 'human' | 'engine' | 'none'
    black: 'human' | 'engine' | 'none'
    invertEnemyDirection?: boolean
    allowBranching?: boolean
    engineLevel?: 1 | 2 | 3 | 4 | 5
  }>()
  
  interface GameResult {flag: MakeMoveFlag, winner: MakeMoveWinner}
  const emit = defineEmits<{
    (event: 'new-move', from: [number, number], to: [number, number], promotion?: string, result?: GameResult): void
    (event: 'on-scroll', result?: GameResult): void
    (event: 'player-changed', playerToMove: Player): void
  }>()
  
  
  // If both or no players are humans, default to white
  const whitePov = computed(() => props.white == 'human' || props.black != 'human')
  const cursorPointer = ref(false)
  const aspectRatio = ref(1)
  const historyRootRef = ref<MoveTreeNode>()
  const historyCurrentNodeRef = ref<MoveTreeNode>()
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const promotionPopup = ref<InstanceType<typeof PromotionPopup>>()
  
  const moveHistory = new MoveHistoryManager(props.allowBranching)
  
  defineExpose({
    // Set the state of the board
    async setState(state: VariantGameState): Promise<GameResult|undefined> {
      const protochess = await getProtochess('ui')
      const result = await protochess.setState(state)
      const stateDiff = await protochess.getStateDiff()
      const historyNotation = await protochess.getMoveHistory()
      const variant = state.initialState
      engineStoredMove = undefined
      
      board.value?.setState(variant, stateDiff)
      if (state.moveHistory.length > 0) {
        nextTick(() => board.value?.setLastMove(state.moveHistory[state.moveHistory.length - 1]))
      }
      aspectRatio.value = variant.boardWidth / variant.boardHeight
      updateMovableSquares(stateDiff, result.flag !== 'Ok')
      
      promotionPopup.value?.initialize(variant)
      moveHistory.initialize(state, historyNotation)
      historyRootRef.value = moveHistory.getRoot()
      historyCurrentNodeRef.value = moveHistory.getCurrentNode()
      emit('player-changed', stateDiff.playerToMove === 0 ? 'white' : 'black')
      
      return handleResult(result)
    },
    
    // Returns which player is to move
    async playerToMove(): Promise<Player> {
      const protochess = await getProtochess('ui')
      return protochess.playerToMove()
    },
    
    // Toggle between white and black point of view
    toggleOrientation() {
      board.value?.toggleOrientation()
    },
    
    // Cause an explosion at the given positions
    explode(positions: [number, number][]) {
      board.value?.explode(positions)
    },
    
    // Draw an arrow between the given positions
    drawArrow(from: [number, number], to: [number, number], brush: string, pieceId?: string) {
      board.value?.drawArrow(from, to, brush, pieceId)
    },
    
    // Clear all arrows
    clearArrows(brush: string) {
      board.value?.clearArrows(brush)
    },
    
    // Go to a given history node
    async jumpToHistoryNode(node: MoveTreeNode) {
      const entry = moveHistory.goTo(node)
      await jumpToMove(entry)
    },
    
    // Expose the history tree for the UI to display
    historyRootRef,
    historyCurrentNodeRef,
    
    // Expose the aspect ratio to improve the layout
    aspectRatio,
  })
  
  
  // Called when the user makes a move on the board
  async function userMovedCallback(from: [number, number], to: [number, number]) {
    const protochess = await getProtochess('ui')
    const possiblePromotions = await protochess.possiblePromotions(from, to)
    let promotion: string|undefined = undefined
    if (possiblePromotions.length > 0) {
      // Choose promotion
      if (!promotionPopup.value) throw new Error('Promotion popup not initialized')
      const flip = !whitePov.value
      let promoPromise = promotionPopup.value.pickPromotion(to, flip, possiblePromotions)
      // Wait for the user to choose a promotion
      let promoIndex = await promoPromise
      if (promoIndex === undefined) {
        // User cancelled, undo the move
        const stateDiff = await protochess.getStateDiff()
        board.value?.setStateDiff(stateDiff)
        return
      }
      promotion = possiblePromotions[promoIndex]
    }
    await playMove({ from, to, promotion })
  }
  
  // Called in order to make the computer play its move
  async function makeEngineMove() {
    if (engineStoredMove) {
      // The engine has already found a move, play it
      await new Promise(resolve => setTimeout(resolve, 100))
      await playMove(engineStoredMove)
      engineStoredMove = undefined
      return
    }
    
    if (!props.engineLevel) throw new Error('Engine level must be set to make the engine play')
    const uiEngine = await getProtochess('ui')
    const state = await uiEngine.getState()
    const searchEngine = await getProtochess('search')
    await searchEngine.setState(state)
    
    // Extremely naive way to define the engine strength, just wait longer for higher levels
    // In the future, we should make a proper difficulty setting in the engine
    const timeoutSeconds = props.engineLevel
    
    // The engine can return a move almost immediately. Wait a second to make it feel more natural
    const minWaitTime = 1000
    const startTime = Date.now()
    try {
      const bestMove = await searchEngine.getBestMoveTimeout(timeoutSeconds)
      const waitTime = Math.max(0, minWaitTime - (Date.now() - startTime))
      await new Promise(resolve => setTimeout(resolve, waitTime))
      if (!moveHistory.canMakeMove()) {
        // The user has navigated to a different position, store the move for later
        engineStoredMove = bestMove
        return
      }
      await playMove(bestMove)
    } catch (e) {
      // Unable to find a move, probably because the game has ended
      console.info('Unable to find a move, game may have ended:', e)
    }
  }
  
  // Plays a move on the engine and updates the UI
  async function playMove(mv: MoveInfo) {
    const protochess = await getProtochess('ui')
    // Play the move on the engine
    const result = await protochess.makeMove(mv)
    const stateDiff = await protochess.getStateDiff()
    // Syncronize the UI
    const gameResult = handleResult(result)
    board.value?.setStateDiff(stateDiff)
    board.value?.setLastMove(mv)
    moveHistory.newMove(mv, result.moveNotation)
    historyCurrentNodeRef.value = moveHistory.getCurrentNode()
    
    // Important: update the player before emitting new-move (otherwise, the player sent to the server will be wrong)
    emit('player-changed', stateDiff.playerToMove === 0 ? 'white' : 'black')
    emit('new-move', mv.from, mv.to, mv.promotion, gameResult)
    
    updateMovableSquares(stateDiff, !!gameResult)
  }
  async function updateMovableSquares(state: StateDiff, gameOver: boolean) {
    if (gameOver) {
      board.value?.setMovable(false, false, [])
      cursorPointer.value = false
      return
    }
    const protochess = await getProtochess('ui')
    const moves = await protochess.legalMoves()
    const moveWhite = props.white == 'human' && state.playerToMove == 0
    const moveBlack = props.black == 'human' && state.playerToMove == 1
    board.value?.setMovable(moveWhite, moveBlack, moves)
    cursorPointer.value = moveWhite || moveBlack
    
    const nextPlayer = state.playerToMove == 0 ? props.white : props.black
    if (nextPlayer == 'engine') {
      makeEngineMove()
    }
  }
  
  function handleResult(result: MakeMoveResult): GameResult | undefined {
    // Show effect for exploded squares
    board.value?.explode(result.exploded)
    if (result.flag === 'Ok') return undefined
    return { flag: result.flag, winner: result.winner }
  }
  
  
  async function onWheel(up: boolean) {
    // Attempt to get the history entry
    const entry = up ? moveHistory.undo() : moveHistory.redo()
    if (!entry) return
    await jumpToMove(entry)
  }
  
  async function jumpToMove(entry: MoveHistoryQueryResult) {
    // Update the state of the engine and the board
    const protochess = await getProtochess('ui')
    const result = await protochess.setState(entry.state)
    const stateDiff = await protochess.getStateDiff()
    board.value?.setStateDiff(stateDiff)
    
    // Update the history view
    historyCurrentNodeRef.value = moveHistory.getCurrentNode()
    
    // Update highlighted move
    if (entry.lastMove) {
      board.value?.setLastMove(entry.lastMove)
    } else {
      board.value?.clearLastMove()
    }
    
    // Update movable squares
    const gameResult = handleResult(result)
    const canMove = !gameResult && moveHistory.canMakeMove()
    updateMovableSquares(stateDiff, !canMove)
    emit('on-scroll', gameResult)
  }
</script>

<style scoped lang="scss">
  .board-container {
    // Needed for promotion popup
    position: relative;
    margin: auto;
    aspect-ratio: v-bind(aspectRatio);
    max-height: calc(100vh - 6rem);
  }
</style>
