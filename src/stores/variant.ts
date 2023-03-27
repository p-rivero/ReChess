import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import type { PublishedVariant, PublishedVariantGui } from '@/protochess/types'
import { VariantDB } from '@/firebase/db'
import { parseVariantJson } from '@/utils/chess/variant-json'
import type { VariantDoc, VariantUpvotesDoc } from '@/firebase/db/schema'
import { placementsToFen } from '@/utils/chess/fen-to-placements'
import { useAuthStore } from '@/stores/auth-user'
import type { Timestamp } from '@firebase/firestore'

export const useVariantStore = defineStore('variant', () => {
  
  // Currently fetched variants
  const variantList = ref<PublishedVariantGui[]>([])
  const authStore = useAuthStore()
  
  let listUpvotesUid: string | undefined = undefined
  // Fetches the list of variants from the database
  // TODO: Add pagination and ordering
  async function refreshList() {
    // Only fetch the list if it hasn't been fetched yet
    // TODO: Check if the order has changed
    if (variantList.value.length > 0) return
    
    // Fetch the list of variant documents from the database
    const docsWithId = await VariantDB.getVariantList()
    
    // Fetch the upvotes for each variant simultaneously
    const upvotes = await Promise.all(docsWithId.map(([_doc, id]) => VariantDB.getVariantUpvotes(id)))
    
    // Fetch whether the user has upvoted each variant simultaneously
    listUpvotesUid = authStore.loggedUser?.uid
    const userUpvoted = await Promise.all(docsWithId.map(([_doc, id]) => VariantDB.hasUserUpvoted(authStore.loggedUser?.uid, id)))
    
    // Convert each pair of documents into a PublishedVariantGui
    variantList.value = []
    for (const [i, [doc, id]] of docsWithId.entries()) {
      const upvotesDoc = upvotes[i]
      if (!upvotesDoc) continue
      const state = readDocument(doc, upvotesDoc, userUpvoted[i], id)
      if (state) variantList.value.push(state)
    }
  }
  
  watch(authStore, async () => {
    // If the user has changed, we need to fetch the upvotes again
    if (authStore.loggedUser?.uid !== listUpvotesUid) {
      listUpvotesUid = authStore.loggedUser?.uid
      variantList.value.forEach(async variant => {
        variant.loggedUserUpvoted = await VariantDB.hasUserUpvoted(authStore.loggedUser?.uid, variant.uid)
      })
    }
  })
  
  // Gets a variant from the database, or returns undefined if it doesn't exist
  async function getVariant(id: string): Promise<PublishedVariantGui | undefined> {
    // First check if the variant has already been fetched
    const existingVariant = variantList.value.find(variant => variant.uid === id)
    if (existingVariant) {
      return existingVariant
    }
    
    // Fetch the documents from the database simultaneously
    return Promise.all([
      VariantDB.getVariantById(id),
      VariantDB.getVariantUpvotes(id),
      VariantDB.hasUserUpvoted(authStore.loggedUser?.uid, id),
    ]).then(([doc, upvotes, userUpvoted]) => {
      // Convert the documents into a PublishedVariantGui
      if (!doc || !upvotes) return undefined
      return readDocument(doc, upvotes, userUpvoted, id)
    })
  }
  
  async function upvote(id: string, upvote: boolean): Promise<void> {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to upvote a variant')
    }
    if (upvote) {
      await VariantDB.upvoteVariant(authStore.loggedUser.uid, id)
    } else {
      await VariantDB.removeUpvoteVariant(authStore.loggedUser.uid, id)
    }
  }
  
  
  function readDocument(doc: VariantDoc, upvotes: VariantUpvotesDoc, userUpvoted: boolean, id: string): PublishedVariantGui | undefined {
    const variant = parseVariantJson(doc.IMMUTABLE.initialState)
    if (!variant) {
      console.error('Illegal variant document', doc)
      return undefined
    }
    const creationTimestamp = doc.IMMUTABLE.creationTime as Timestamp
    const pv: PublishedVariant = {
      ...variant,
      uid: id,
      creationTime: creationTimestamp.toDate(),
      creatorDisplayName: doc.IMMUTABLE.creatorDisplayName,
      creatorId: doc.IMMUTABLE.creatorId ?? undefined,
      numUpvotes: upvotes.numUpvotes,
      loggedUserUpvoted: userUpvoted,
      // Overwrite the existing name and description with the ones from the document
      displayName: doc.name,
      description: doc.description,
    }
    // Also compute the GUI-specific fields, since almost all components will
    // need them and it's faster and easier to do it only once here
    const pvg: PublishedVariantGui = {
      ...pv,
      fen: placementsToFen(variant),
      inCheck: false, // Don't show the check indicator in the preview
    }
    return pvg
  }
  
  return { refreshList, getVariant, upvote, variantList }
})
