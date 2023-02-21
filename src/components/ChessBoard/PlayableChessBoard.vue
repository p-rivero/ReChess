<!--
  This component is built on top of ViewableChessBoard and is meant for boards where the user controls 1 or 2 of the players.
  It uses the Protochess engine to restrict the user's moves to valid ones.
  Note that, since the Protochess object is shared, at any given time there can only be 1 instance of PlayableChessBoard.
-->


<template>
  <ViewableChessBoard 
    :size=props.size
    :white-pov=whitePov
    :view-only=false
    
    ref="board"
  />
</template>

<script setup lang="ts">
  import type { GameState, MoveInfo, MakeMoveResult } from '@/protochess/interfaces';
  import { getProtochess } from '@/protochess/protochess';
  import { ref, onMounted } from 'vue';
  import ViewableChessBoard from './ViewableChessBoard.vue'
  
  interface CustomMoveCallback {
    (playerToMove: 'white'|'black'): Promise<MoveInfo>
  }
  
  const props = defineProps<{
    size: number
    white: 'human' | 'engine' | CustomMoveCallback
    black: 'human' | 'engine' | CustomMoveCallback
  }>()
  // If both or no players are humans, default to white
  const whitePov = props.white == 'human' || props.black != 'human'
  
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
    
  onMounted(async () => {
    // At the start, add a callback to play the user's moves
    board.value?.onMoveCallback(userMovedCallback)
  })
  
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
    },
    
    // Move a piece from one position to another, and optionally promote it
    makeMove: (from: [number, number], to: [number, number], promotion?: {color: 'white'|'black', id: string}) => {
      board.value?.makeMove(from, to, promotion)
    },
    
    // Toggle between white and black point of view
    toggleOrientation: () => {
      board.value?.toggleOrientation()
    },
    
    // Set a callback that will be called when the user makes a move (not when makeMove() is called)
    onMoveCallback: (callback: (from: [number, number], to: [number, number]) => void) => {
      board.value?.onMoveCallback(async (from, to) => {
        await userMovedCallback(from, to)
        callback(from, to)
      })
    },
    
    // Cause an explosion at the given positions
    explode: (positions: [number, number][]) => {
      board.value?.explode(positions)
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
    const bestMove = await protochess.getBestMoveTimeout(1)
    console.log('Eval (from engine POV):', bestMove.evaluation, 'Depth:', bestMove.depth)
    await synchronizeBoardState(bestMove)
  }
  
  // Synchonize the board state with the protochess engine
  // If playMoveBefore is specified, it will be played before synchronizing the state
  async function synchronizeBoardState(playMoveBefore?: MoveInfo) {
    const protochess = await getProtochess()
    if (playMoveBefore) {
      const result = await protochess.makeMove(playMoveBefore)
      board.value?.makeMove(playMoveBefore.from, playMoveBefore.to)
      handleResult(result)
    }
    const state = await protochess.getState()
    const moves = await protochess.legalMoves()
    const moveWhite = props.white == 'human' && state.playerToMove == 0
    const moveBlack = props.black == 'human' && state.playerToMove == 1
    board.value?.setState(state)
    board.value?.setMovable(moveWhite, moveBlack, moves)
    
    const nextPlayer = state.playerToMove == 0 ? props.white : props.black
    if (nextPlayer == 'engine') {
      makeEngineMove()
    } else if (typeof nextPlayer == 'function') {
      const move = await nextPlayer(state.playerToMove == 0 ? 'white' : 'black')
      synchronizeBoardState(move)
    }
  }
  
  async function handleResult(result: MakeMoveResult) {
    // Show effect for exploded squares
    board.value?.explode(result.exploded)
    console.log(result)
  }
  
</script>
