<!--
  This component is built on top of ViewableChessBoard and is meant for playable boards where the user controls between 0 and 2 players.
  It allows using the scroll wheel to rewind the game.
  It uses the Protochess engine to restrict the user's moves to valid ones.
  Note that, since the Protochess object is shared, at any given time there can only be 1 instance of PlayableChessBoard.
-->


<template>
  <ViewableChessBoard 
    :white-pov="whitePov"
    :view-only="false"
    :show-coordinates="true"
    :capture-wheel-events="true"
    @user-moved="userMovedCallback"
    @wheel="onWheel"
    
    ref="board"
  />
</template>

<script setup lang="ts">
  import type { GameState, MoveInfo, MakeMoveResult, MakeMoveFlag, MakeMoveWinner } from '@/protochess/interfaces';
  import { getProtochess } from '@/protochess/protochess'
  import { MoveHistoryManager } from '@/utils/move-history-manager'
  import { ref } from 'vue';
  import ViewableChessBoard from './ViewableChessBoard.vue'
  
  export interface CustomMoveCallback {
    (playerToMove: 'white'|'black'): Promise<MoveInfo>
  }
  
  const props = defineProps<{
    white: 'human' | 'engine' | CustomMoveCallback
    black: 'human' | 'engine' | CustomMoveCallback
  }>()
  
  const emit = defineEmits<{
    (event: 'piece-moved', from?: [number, number], to?: [number, number]): void
    (event: 'game-over', flag: MakeMoveFlag, winner: MakeMoveWinner): void
  }>()
  
  
  // If both or no players are humans, default to white
  const whitePov = props.white == 'human' || props.black != 'human'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  
  const moveHistory = new MoveHistoryManager(false)
  
  defineExpose({
    // Set the state of the board by loading a FEN string
    loadFen: async (fen: string) => {
      const protochess = await getProtochess()
      await protochess.loadFen(fen)
      await synchronizeBoardState()
    },
    
    // Set the state of the board
    setState: async (state: GameState) => {
      const protochess = await getProtochess()
      await protochess.setState(state)
      await synchronizeBoardState()
      moveHistory.initialize(state)
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove: (from: [number, number], to: [number, number], promotion?: {color: 'white'|'black', id: string}) => {
      board.value?.makeMove(from, to, promotion)
    },
    
    // Toggle between white and black point of view
    toggleOrientation: () => {
      board.value?.toggleOrientation()
    },
    
    // Cause an explosion at the given positions
    explode: (positions: [number, number][]) => {
      board.value?.explode(positions)
    },
    
    // Draw an arrow between the given positions
    drawArrow: (from: [number, number], to: [number, number], brush: string) => {
      board.value?.drawArrow(from, to, brush)
    },
    
    // Clear all arrows
    clearArrows: (brush: string) => {
      board.value?.clearArrows(brush)
    },
  })
  
  
  // Called when the user makes a move on the board
  async function userMovedCallback(from: [number, number], to: [number, number]) {
    const protochess = await getProtochess()
    const possiblePromotions = await protochess.possiblePromotions(from[0], from[1], to[0], to[1])
    // TODO: Allow the user to choose the promotion piece
    const promotion = possiblePromotions.length > 0 ? possiblePromotions[0] : undefined
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
    const bestMove = await protochess.getBestMoveTimeout(timeoutSeconds)
    
    const waitTime = Math.max(0, minWaitTime - (Date.now() - startTime))
    await new Promise(resolve => setTimeout(resolve, waitTime))
    await synchronizeBoardState(bestMove)
  }
  
  // Synchonize the board state with the protochess engine
  // If playMoveBefore is specified, it will be played before synchronizing the state
  async function synchronizeBoardState(playMoveBefore?: MoveInfo) {
    const protochess = await getProtochess()
    let moveResult: 'none'|'ok'|'stop' = 'none'
    if (playMoveBefore) {
      // Play the move before synchronizing the state
      const result = await protochess.makeMove(playMoveBefore)
      board.value?.highlightMove(playMoveBefore.from, playMoveBefore.to)
      // Handle the result, if the game has ended don't emit piece-moved
      moveResult = handleResult(result)
    }
    const state = await protochess.getState()
    board.value?.setState(state)
    
    // Move was played, emit piece-moved and store history
    if (moveResult !== 'none') {
      moveHistory.newMove(playMoveBefore!, state)
      emit('piece-moved', playMoveBefore!.from, playMoveBefore!.to)
    }
    // Game has ended, don't continue
    if (moveResult === 'stop') return
    
    updateMovableSquares(state)
  }
  async function updateMovableSquares(state: GameState) {
    const protochess = await getProtochess()
    const moves = await protochess.legalMoves()
    const moveWhite = props.white == 'human' && state.playerToMove == 0
    const moveBlack = props.black == 'human' && state.playerToMove == 1
    board.value?.setMovable(moveWhite, moveBlack, moves)
    
    const nextPlayer = state.playerToMove == 0 ? props.white : props.black
    if (nextPlayer == 'engine') {
      makeEngineMove()
    } else if (typeof nextPlayer == 'function') {
      const move = await nextPlayer(state.playerToMove == 0 ? 'white' : 'black')
      synchronizeBoardState(move)
    }
  }
  
  function handleResult(result: MakeMoveResult): 'ok'|'stop' {
    // Show effect for exploded squares
    board.value?.explode(result.exploded)
    if (result.flag === 'Ok') return 'ok'
    emit('game-over', result.flag, result.winner)
    return 'stop'
  }
  
  
  async function onWheel(up: boolean) {
    const protochess = await getProtochess()
    // Attempt to get the history entry
    const entry = up ? moveHistory.undo() : moveHistory.redo()
    if (!entry) return
    
    // Update the state of the engine and the board
    await protochess.setState(entry.state)
    const guiState = await protochess.getState()
    board.value?.setState(guiState)
    
    // Update highlighted move
    if (entry.move) {
      board.value?.highlightMove(entry.move.from, entry.move.to)
    } else {
      board.value?.clearHighlightMove()
    }
    
    // Update movable squares
    if (moveHistory.canMakeMove()) {
      updateMovableSquares(entry.state)
    } else {
      board.value?.setMovable(false, false, [])
    }
    emit('piece-moved')
  }
  
</script>
