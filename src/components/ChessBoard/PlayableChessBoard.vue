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
  import type { MoveInfo, MakeMoveResult, MakeMoveFlag, MakeMoveWinner, Player, Variant, StateDiff } from '@/protochess/types'
  import { getProtochess } from '@/protochess'
  import { MoveHistoryManager } from '@/utils/chess/move-history-manager'
  import { computed, ref } from 'vue'
  import ViewableChessBoard from './ViewableChessBoard.vue'
  import PromotionPopup from '@/components/GameUI/PromotionPopup.vue'
  
  const props = defineProps<{
    white: 'human' | 'engine' | 'none'
    black: 'human' | 'engine' | 'none'
    invertEnemyDirection?: boolean
  }>()
  
  type Result = {flag: MakeMoveFlag, winner: MakeMoveWinner}
  const emit = defineEmits<{
    (event: 'piece-moved', from?: [number, number], to?: [number, number], result?: Result): void
    (event: 'player-changed', playerToMove: Player): void
  }>()
  
  
  // If both or no players are humans, default to white
  const whitePov = computed(() => props.white == 'human' || props.black != 'human')
  const cursorPointer = ref(false)
  const aspectRatio = ref(1)
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const promotionPopup = ref<InstanceType<typeof PromotionPopup>>()
  
  const moveHistory = new MoveHistoryManager(false)
  
  defineExpose({
    // Set the state of the board
    async setState(variant: Variant, history: MoveInfo[]) {
      const protochess = await getProtochess()
      await protochess.setState({ initialState: variant, moveHistory: history })
      const stateDiff = await protochess.getStateDiff()
      
      board.value?.setState(variant)
      board.value?.setStateDiff(stateDiff)
      aspectRatio.value = variant.boardWidth / variant.boardHeight
      updateMovableSquares(stateDiff)
      
      promotionPopup.value?.initialize(variant)
      moveHistory.initialize(variant)
      emit('player-changed', variant.playerToMove === 0 ? 'white' : 'black')
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove(from: [number, number], to: [number, number], promotion?: string) {
      board.value?.makeMove(from, to, promotion)
    },
    
    // Returns which player is to move
    async playerToMove(): Promise<Player> {
      const protochess = await getProtochess()
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
  })
  
  
  // Called when the user makes a move on the board
  async function userMovedCallback(from: [number, number], to: [number, number]) {
    const protochess = await getProtochess()
    const possiblePromotions = await protochess.possiblePromotions(from, to)
    let promotion: string|undefined = undefined
    if (possiblePromotions.length > 0) {
      // Choose promotion
      if (!promotionPopup.value) throw new Error('Promotion popup not initialized')
      let promoPromise = promotionPopup.value.pickPromotion(to, possiblePromotions)
      // Wait for the user to choose a promotion
      let promoIndex = await promoPromise
      if (promoIndex === undefined) {
        // User cancelled
        await synchronizeBoardState()
        return
      }
      promotion = possiblePromotions[promoIndex]
    }
    await synchronizeBoardState({ from, to, promotion })
  }
  
  // Called in order to make the computer play its move
  async function makeEngineMove() {
    const protochess = await getProtochess()
    // TODO: Allow the user to choose the search timeout
    const timeoutSeconds = 2
    
    // The engine can return a move almost immediately. Wait a second to make it feel more natural
    const minWaitTime = 1000
    const startTime = Date.now()
    try {
      const bestMove = await protochess.getBestMoveTimeout(timeoutSeconds)
      const waitTime = Math.max(0, minWaitTime - (Date.now() - startTime))
      await new Promise(resolve => setTimeout(resolve, waitTime))
      await synchronizeBoardState(bestMove)
    } catch (e) {
      // Unable to find a move, probably because the game has ended
      console.info('Unable to find a move, game may have ended:', e)
    }
  }
  
  // Synchonize the board state with the protochess engine
  // If playMoveBefore is specified, it will be played before synchronizing the state
  async function synchronizeBoardState(playMoveBefore?: MoveInfo) {
    const protochess = await getProtochess()
    // 'N/A' if no move was played, undefined if a move was played but the game hasn't ended
    let moveResult: Result | undefined | 'N/A' = 'N/A'
    if (playMoveBefore) {
      // Play the move before synchronizing the state
      const result = await protochess.makeMove(playMoveBefore)
      board.value?.setLastMove(playMoveBefore)
      // Handle the result, if the game has ended don't emit piece-moved
      moveResult = handleResult(result)
    }
    const stateDiff = await protochess.getStateDiff()
    board.value?.setStateDiff(stateDiff)
    
    // Move was played, emit piece-moved and store history
    if (moveResult !== 'N/A') {
      if (!playMoveBefore) throw new Error('playMoveBefore is undefined')
      moveHistory.newMove(playMoveBefore, moveResult)
      emit('piece-moved', playMoveBefore.from, playMoveBefore.to, moveResult)
      emit('player-changed', stateDiff.playerToMove === 0 ? 'white' : 'black')
      // Game has ended, don't continue
      if (moveResult) return
    }
    
    updateMovableSquares(stateDiff)
  }
  async function updateMovableSquares(state: StateDiff) {
    const protochess = await getProtochess()
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
  
  function handleResult(result: MakeMoveResult): Result | undefined {
    // Show effect for exploded squares
    board.value?.explode(result.exploded)
    if (result.flag === 'Ok') return undefined
    return { flag: result.flag, winner: result.winner }
  }
  
  
  async function onWheel(up: boolean) {
    const protochess = await getProtochess()
    // Attempt to get the history entry
    const entry = up ? moveHistory.undo() : moveHistory.redo()
    if (!entry) return
    
    // Update the state of the engine and the board
    await protochess.setState(entry.state)
    const stateDiff = await protochess.getStateDiff()
    board.value?.setStateDiff(stateDiff)
    
    // Update highlighted move
    if (entry.lastMove) {
      board.value?.setLastMove(entry.lastMove)
    } else {
      board.value?.clearLastMove()
    }
    
    // Update movable squares
    if (moveHistory.canMakeMove()) {
      updateMovableSquares(stateDiff)
    } else {
      board.value?.setMovable(false, false, [])
      cursorPointer.value = false
    }
    emit('piece-moved', undefined, undefined, entry.result)
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
