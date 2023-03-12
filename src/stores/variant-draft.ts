import { ref } from 'vue'
import { defineStore } from 'pinia'
import sanitizeFilename from 'sanitize-filename'

import type { GameState, PieceDefinition, PiecePlacement } from '@/protochess/types'
import { isGameState } from '@/protochess/types.guard'
import { exportFile, importFile } from '@/utils/file-io'
import { clone } from '@/utils/ts-utils'

export const useVariantDraftStore = defineStore('variant-draft', () => {
  
  // Initialize the draft in json format from localStorage if it exists
  const variantDraftJSON = localStorage.getItem('variantDraft')
  let variantDraftObj = variantDraftJSON ? JSON.parse(variantDraftJSON) : null
  // Check if the draft fits the GameState type. If it doesn't, set the draft to the default value.
  if (!isValidGameState(variantDraftObj)) {
    variantDraftObj = DEFAULT_DRAFT
  }
  const variantDraftTyped = variantDraftObj as GameState
  
  const state = ref(variantDraftTyped)
  
  function save() {
    localStorage.setItem('variantDraft', JSON.stringify(state.value))
  }
  
  function addPiece() {
    // Clone the default piece and add it to the list of pieces
    const newPiece = clone(DEFAULT_PIECE)
    state.value.pieceTypes.push(newPiece)
    save()
  }
  function setWidth(width: number) {
    state.value.boardWidth = width
    state.value.pieces = state.value.pieces.filter((piece: PiecePlacement) => piece.x < width)
    save()
  }
  function setHeight(height: number) {
    state.value.boardHeight = height
    state.value.pieces = state.value.pieces.filter((piece: PiecePlacement) => piece.y < height)
    save()
  }
  
  
  function backupFile() {
    const file = new Blob([JSON.stringify(state.value)], { type: 'application/json' })
    let fileName = `Unnamed variant.json`
    if (state.value.variantDisplayName) {
      const sanitizedName = sanitizeFilename(state.value.variantDisplayName)
      if (sanitizedName.length > 0 && sanitizedName !== 'Variant name') {
        fileName = `${sanitizedName}.json`
      }
    }
    exportFile(file, fileName)
  }
  
  async function uploadFile(): Promise<boolean> {
    const fileBlob = await importFile('application/json')
    const fileText = await fileBlob.text()
    try {
      const fileObj = JSON.parse(fileText)
      if (isValidGameState(fileObj)) {
        state.value = fileObj
        save()
        return true
      }
    } catch (e) {
      // Do nothing and return false
    }
    return false
  }
  
  
  function isValidGameState(state: any): boolean {
    if (!isGameState(state)) return false
    if (state.pieceTypes.length > 26) return false
    if (state.boardWidth < 1 || state.boardWidth > 16) return false
    if (state.boardHeight < 1 || state.boardHeight > 16) return false
    if (state.invalidSquares.some((square: any) => square.x < 0 || square.x >= state.boardWidth || square.y < 0 || square.y >= state.boardHeight)) return false
    if (state.pieces.some((piece: any) => piece.x < 0 || piece.x >= state.boardWidth || piece.y < 0 || piece.y >= state.boardHeight)) return false
    if (state.epSquareAndVictim &&
      (  state.epSquareAndVictim[0][0] < 0
      || state.epSquareAndVictim[0][0] >= state.boardWidth
      || state.epSquareAndVictim[0][1] < 0
      || state.epSquareAndVictim[0][1] >= state.boardHeight
      || state.epSquareAndVictim[1][0] < 0
      || state.epSquareAndVictim[1][0] >= state.boardWidth
      || state.epSquareAndVictim[1][1] < 0
      || state.epSquareAndVictim[1][1] >= state.boardHeight)) return false
    if (state?.timesInCheck?.some((times: any) => times < 0 || times > 200)) return false
    return true
  }
  
  // Attempts to publish the variant to the server. If successful, returns the id of the variant.
  async function publish(): Promise<string | undefined> {
    return undefined
  }

  return { state, save, addPiece, setWidth, setHeight, backupFile, uploadFile, publish }
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

const DEFAULT_PIECE: PieceDefinition = {
  ids: ['', ''],
  isLeader: false,
  castleFiles: undefined,
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
  displayName: '',
  imageUrls: [undefined, undefined],
}
