import type { GameState } from "@/protochess/types"
import { defineStore } from "pinia"
import { VariantDB } from "@/firebase/db"
import { parseGameStateJson } from "@/utils/chess/game-state-json"

export const useVariantStore = defineStore('variant', () => {
  async function getVariantState(id: string): Promise<GameState | undefined> {
    // Get the variant document from the database
    const doc = await VariantDB.getVariantById(id)
    if (!doc) return undefined
    // Parse the initial state from the document
    const state = parseGameStateJson(doc.initialState)
    if (!state) {
      console.error('Invalid variant document', doc)
      return undefined
    }
    return state
  }
  
  return { getVariantState }
})
