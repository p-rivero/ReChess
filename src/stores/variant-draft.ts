import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import sanitizeFilename from 'sanitize-filename'

import { VariantDB } from '@/firebase/db'
import { clone, objectEquals } from '@/helpers/ts-utils'
import { exportFile } from '@/helpers/file-io'
import { parseVariantJson } from '@/helpers/chess/variant-json'
import { useAuthStore } from '@/stores/auth-user'
import type { FullPieceDef, Variant } from '@/protochess/types'

export const useVariantDraftStore = defineStore('variant-draft', () => {
  
  // Initialize the draft in json format from localStorage if it exists
  const variantDraftJSON = localStorage.getItem('variantDraft')
  let initialState = clone(DEFAULT_DRAFT)
  if (variantDraftJSON) {
    const storedDraft = parseVariantJson(variantDraftJSON)
    if (storedDraft) {
      initialState = storedDraft
    }
  }
  const state = ref<Variant>(initialState)
  
  // Save every time the state changes
  watch(state, () => {
    localStorage.setItem('variantDraft', JSON.stringify(state.value))
  }, { deep: true })
  
  function addPiece() {
    // Clone the default piece and add it to the list of pieces
    const newPiece = clone(DEFAULT_PIECE)
    state.value.pieceTypes.push(newPiece)
  }
  
  
  function backupFile() {
    const file = new Blob([JSON.stringify(state.value)], { type: 'application/json' })
    let fileName = 'Unnamed variant.json'
    if (state.value.displayName) {
      const sanitizedName = sanitizeFilename(state.value.displayName)
      if (sanitizedName.length > 0 && sanitizedName !== 'Variant name') {
        fileName = `${sanitizedName}.json`
      }
    }
    exportFile(file, fileName)
  }
  
  async function loadFile(file: Blob): Promise<boolean> {
    const fileText = await file.text()
    const newGameState = parseVariantJson(fileText)
    if (!newGameState) return false
    state.value = newGameState
    return true
  }
  
  // Returns true if there is already a variant with the same name as the draft
  async function nameExists(): Promise<boolean> {
    const num = await VariantDB.getNumVariantsWithName(state.value.displayName)
    return num > 0
  }
  
  // Attempts to publish the variant to the server. If successful, returns the id of the variant.
  async function publish(): Promise<string | undefined> {
    const authStore = useAuthStore()
    if (!authStore.loggedUser) return
    try {
      const id = await VariantDB.createVariant(authStore.loggedUser.uid, authStore.loggedUser.displayName, state.value)
      // Draft published successfully, remove it
      discardDraft()
      return id
    } catch (e) {
      console.error('Error while trying to create variant', e)
      return
    }
  }
  
  // Returns true if the draft is not empty
  function hasDraft() {
    return !objectEquals(state.value, DEFAULT_DRAFT)
  }
  
  // Discard the current draft
  function discardDraft() {
    state.value = clone(DEFAULT_DRAFT)
  }

  return { state, addPiece, backupFile, loadFile, publish, nameExists, hasDraft, discardDraft }
})

const DEFAULT_DRAFT: Readonly<Variant> = {
  displayName: '',
  description: '',
  fen: '/',
  pieceTypes: [],
  boardWidth: 8,
  boardHeight: 8,
  playerToMove: 0,
  globalRules: {
    capturingIsForced: false,
    checkIsForbidden: false,
    stalematedPlayerLoses: false,
    invertWinConditions: false,
    repetitionsDraw: 3,
    checksToLose: 0,
  },
  tags: [],
}

const DEFAULT_PIECE: Readonly<FullPieceDef> = {
  ids: ['', ''],
  notationPrefix: [null, null],
  isLeader: false,
  castleFiles: undefined,
  isCastleRook: false,
  explodeOnCapture: false,
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
