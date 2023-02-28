<template>
  <PlayableChessBoard ref='board' :size=1000 :white="'human'" :black="'human'" />
  <p> Board evaluation: {{ evaluation }} </p>
</template>

<script setup lang="ts">
  import {ref, onMounted} from 'vue'
  import PlayableChessBoard from '@/components/ChessBoard/PlayableChessBoard.vue'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { getProtochess } from '@/protochess/protochess'
  import { pairToCoords } from '@/utils/chess-coords'
  
  const board = ref<InstanceType<typeof PlayableChessBoard>>()
  const draftStore = useVariantDraftStore()
  
  const evaluation = ref<string>('')
  
  onMounted(async () => {
    if (board.value === undefined) {
      throw new Error('Reference to board is undefined')
    }
    await board.value.setState(draftStore.state)
    board.value.onMoveCallback(updateEvaluation)
    await updateEvaluation()
  })
  
  async function updateEvaluation() {
    const protochess = await getProtochess()
    const mv = await protochess.getBestMoveTimeout(1)
    const player = await protochess.playerToMove()
    let evalString: string
    if (typeof mv.evaluation === 'string' && mv.evaluation.startsWith('#')) {
      const mateIn = parseInt(mv.evaluation.slice(1))
      const adjustedMate = player === 'white' ? mateIn : -mateIn
      evalString = `#${adjustedMate}`
    } else if (typeof mv.evaluation === 'number') {
      const evalPawns = mv.evaluation / 100
      const adjustedEval = player === 'white' ? evalPawns : -evalPawns
      evalString = `${adjustedEval}`
    } else {
      throw new Error('Unexpected evaluation format: ' + mv.evaluation)
    }
    evaluation.value = `${evalString}, best move: ${pairToCoords(mv.from)}->${pairToCoords(mv.to)} (search depth: ${mv.depth})`
  }
</script>

