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
  pieceTypes: [
    {
      ids: ['A', 'a'],
      isLeader: true,
      castleFiles: [0, 7],
      isCastleRook: false,
      explodes: false,
      explosionDeltas: [],
      immuneToExplosion: false,
      promotionSquares: [],
      promoVals: [[], []],
      doubleJumpSquares: [],
      attackSlidingDeltas: [],
      attackJumpDeltas: [],
      attackNorth: false,
      attackSouth: false,
      attackEast: false,
      attackWest: false,
      attackNortheast: false,
      attackNorthwest: false,
      attackSoutheast: false,
      attackSouthwest: false,
      translateJumpDeltas: [],
      translateSlidingDeltas: [],
      translateNorth: false,
      translateSouth: false,
      translateEast: false,
      translateWest: false,
      translateNortheast: false,
      translateNorthwest: false,
      translateSoutheast: false,
      translateSouthwest: false,
      winSquares: [],
      displayName: 'Leader',
      imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg', 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg'],
    },
    {
      ids: ['B', 'b'],
      isLeader: false,
      castleFiles: [0, 7],
      isCastleRook: false,
      explodes: false,
      explosionDeltas: [],
      immuneToExplosion: false,
      promotionSquares: [],
      promoVals: [[], []],
      doubleJumpSquares: [],
      attackSlidingDeltas: [],
      attackJumpDeltas: [],
      attackNorth: false,
      attackSouth: false,
      attackEast: false,
      attackWest: false,
      attackNortheast: false,
      attackNorthwest: false,
      attackSoutheast: false,
      attackSouthwest: false,
      translateJumpDeltas: [],
      translateSlidingDeltas: [],
      translateNorth: false,
      translateSouth: false,
      translateEast: false,
      translateWest: false,
      translateNortheast: false,
      translateNorthwest: false,
      translateSoutheast: false,
      translateSouthwest: false,
      winSquares: [],
      displayName: 'Another Piece',
      imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg', 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg'],
    }
  ],
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
