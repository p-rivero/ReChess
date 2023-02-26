import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { GameState, PieceDefinition } from '@/protochess/interfaces'
import { isGameState } from '@/protochess/interfaces.guard'

export const useVariantDraftStore = defineStore('variant-draft', () => {
  
  // Initialize the draft in json format from localStorage if it exists
  const variantDraftJSON = localStorage.getItem('variantDraft')
  let variantDraftObj = variantDraftJSON ? JSON.parse(variantDraftJSON) : null
  // Check if the draft fits the GameState type. If it doesn't, set the draft to the default value.
  if (!isGameState(variantDraftObj)) {
    variantDraftObj = DEFAULT_DRAFT
  }
  const variantDraftTyped = variantDraftObj as GameState
  
  const variantDraft = ref(variantDraftTyped)
  
  function getPiece(index: number): PieceDefinition | null {
    if (index < 0 || index >= variantDraft.value.pieceTypes.length)
      return null
    return variantDraft.value.pieceTypes[index]
  }

  return { variantDraft, getPiece }
})

const DEFAULT_DRAFT: GameState = {
  pieceTypes: [],
  boardWidth: 8,
  boardHeight: 8,
  invalidSquares: [],
  pieces: [],
  playerToMove: 0,
  globalRules: {
    capturingIsForced: false,
    checkIsForbidden: false,
    stalematedPlayerLoses: false,
    invertWinConditions: false,
    repetitionsDraw: 3,
    checksToLose: 0,
  },
}
