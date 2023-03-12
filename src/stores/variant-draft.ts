import { ref } from 'vue'
import { defineStore } from 'pinia'
import sanitizeFilename from 'sanitize-filename'

import type { GameState, PieceDefinition, PiecePlacement } from '@/protochess/types'
import { exportFile, importFile } from '@/utils/file-io'
import { clone } from '@/utils/ts-utils'
import { parseGameStateJson } from '@/utils/chess/game-state-json'
import { createVariant } from '@/firebase/db/variant'
import { useAuthStore } from '@/stores/auth-user'

export const useVariantDraftStore = defineStore('variant-draft', () => {
  
  // Initialize the draft in json format from localStorage if it exists
  const variantDraftJSON = localStorage.getItem('variantDraft')
  let initialState = clone(DEFAULT_DRAFT)
  if (variantDraftJSON) {
    let storedDraft = parseGameStateJson(variantDraftJSON)
    if (storedDraft) {
      initialState = storedDraft
    }
  }
  const state = ref(initialState)
  
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
    const newGameState = parseGameStateJson(fileText)
    if (!newGameState) return false
    state.value = newGameState
    save()
    return true
  }
  
  // Attempts to publish the variant to the server. If successful, returns the id of the variant.
  async function publish(): Promise<string | undefined> {
    const authStore = useAuthStore()
    await authStore.isLogged()
    if (!authStore.user) return undefined
    try {
      const id = await createVariant(authStore.user.uid, state.value)
      // Draft published successfully, remove it from localStorage
      localStorage.removeItem('variantDraft')
      await new Promise(resolve => setTimeout(resolve, 3000))
      return id
    } catch (e) {
      console.error('Error while trying to create variant', e)
      return undefined
    }
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
