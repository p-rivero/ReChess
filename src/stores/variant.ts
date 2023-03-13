import { defineStore } from "pinia"
import { ref } from "vue"

import type { GameState } from "@/protochess/types"
import { VariantDB } from "@/firebase/db"
import { parseGameStateJson } from "@/utils/chess/game-state-json"
import type { VariantDoc } from "@/firebase/db/schema"

export const useVariantStore = defineStore('variant', () => {
  
  // Currently fetched variants
  const variantList = ref<GameState[]>([])
  
  // Fetches the list of variants from the database
  // TODO: Add pagination and ordering
  async function refreshList() {
    // Only fetch the list if it hasn't been fetched yet
    // TODO: Check if the order has changed
    if (variantList.value.length > 0) return
    
    // Fetch the list of variant documents from the database
    const docsWithId = await VariantDB.getVariantList()
    variantList.value = []  
    for (const [doc, id] of docsWithId) {
      const state = parseGameState(doc, id)
      if (state) variantList.value.push(state)
    }
  }
  
  // Gets a variant from the database, or returns undefined if it doesn't exist
  async function getVariant(id: string): Promise<GameState | undefined> {
    // First check if the variant has already been fetched
    const existingVariant = variantList.value.find(variant => variant.variantUID === id)
    if (existingVariant) {
      return existingVariant
    }
    
    // Get the variant document from the database
    const doc = await VariantDB.getVariantById(id)
    if (!doc) return undefined
    return parseGameState(doc, id)
  }
  
  function parseGameState(doc: VariantDoc, id: string): GameState | undefined {
    const state = parseGameStateJson(doc.SERVER.initialState)
    if (!state) {
      console.error('Illegal variant document', doc)
      return undefined
    }
    // Update fields with the most recent data (this is redundant when 
    // the variant has just been created, but the user can edit these fields)
    state.variantUID = id
    state.variantDisplayName = doc.name
    state.variantDescription = doc.description
    state.creatorDisplayName = doc.creatorDisplayName
    return state
  }
  
  return { refreshList, getVariant, variantList }
})
