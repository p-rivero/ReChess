import { defineStore } from "pinia"
import { ref } from "vue"

import type { VariantGui } from "@/protochess/types"
import { VariantDB } from "@/firebase/db"
import { parseVariantJson } from "@/utils/chess/variant-json"
import type { VariantDoc } from "@/firebase/db/schema"
import { placementsToFen } from "@/utils/chess/fen-to-placements"

export const useVariantStore = defineStore('variant', () => {
  
  // Currently fetched variants
  const variantList = ref<VariantGui[]>([])
  
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
      const state = readDocument(doc, id)
      if (state) variantList.value.push(state)
    }
  }
  
  // Gets a variant from the database, or returns undefined if it doesn't exist
  async function getVariant(id: string): Promise<VariantGui | undefined> {
    // First check if the variant has already been fetched
    const existingVariant = variantList.value.find(variant => variant.uid === id)
    if (existingVariant) {
      return existingVariant
    }
    
    // Get the variant document from the database
    const doc = await VariantDB.getVariantById(id)
    if (!doc) return undefined
    return readDocument(doc, id)
  }
  
  
  function readDocument(doc: VariantDoc, id: string): VariantGui | undefined {
    const variant = parseVariantJson(doc.SERVER.initialState)
    if (!variant) {
      console.error('Illegal variant document', doc)
      return undefined
    }
    // Update fields with the most recent data (this is redundant when 
    // the variant has just been created, but the user can edit these fields)
    variant.uid = id
    variant.displayName = doc.name
    variant.description = doc.description
    variant.creatorDisplayName = doc.creatorDisplayName
    variant.creatorUsername = 'TODO'
    // Also compute the GUI-specific fields, since almost all components will
    // need them and it's faster and easier to do it only once here
    const variantGui: VariantGui = {
      ...variant,
      fen: placementsToFen(variant),
      inCheck: false,
    }
    return variantGui
  }
  
  return { refreshList, getVariant, variantList }
})
