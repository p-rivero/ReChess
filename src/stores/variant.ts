import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import type { PublishedVariant, PublishedVariantGui } from '@/protochess/types'
import { VariantDB } from '@/firebase/db'
import { parseVariantJson } from '@/utils/chess/variant-json'
import type { VariantDoc } from '@/firebase/db/schema'
import { placementsToFen } from '@/utils/chess/fen-to-placements'
import { useAuthStore } from '@/stores/auth-user'
import type { Timestamp } from '@firebase/firestore'

export const useVariantStore = defineStore('variant', () => {
  
  // Currently fetched variants
  const variantList = ref<PublishedVariantGui[]>([])
  const variantListOrder = ref<'newest' | 'upvotes'>('newest')
  
  const authStore = useAuthStore()
  
  let listUpvotesUid: string | undefined = undefined
  // Fetches the list of variants from the database
  // TODO: Add pagination
  async function refreshList(order: 'newest' | 'upvotes') {
    // Only fetch the list if it hasn't been fetched yet (or if the order has changed)
    if (variantList.value.length > 0 && variantListOrder.value === order) return
    
    // Fetch the list of variant documents from the database
    const docsWithId = await VariantDB.getVariantList(order)
    
    // Fetch whether the user has upvoted each variant simultaneously
    listUpvotesUid = authStore.loggedUser?.uid
    const userUpvoted = await Promise.all(docsWithId.map(([_doc, id]) => VariantDB.hasUserUpvoted(authStore.loggedUser?.uid, id)))
    
    // Convert each pair of documents into a PublishedVariantGui
    const result = []
    for (const [i, [doc, id]] of docsWithId.entries()) {
      const state = readDocument(doc, userUpvoted[i], id)
      if (state) result.push(state)
    }
    variantList.value = result
    variantListOrder.value = order
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
    
    // Fetch both documents from the database simultaneously
    return Promise.all([
      VariantDB.getVariantById(id),
      VariantDB.hasUserUpvoted(authStore.loggedUser?.uid, id),
    ]).then(([doc, userUpvoted]) => {
      // Convert the documents into a PublishedVariantGui
      if (!doc) return undefined
      return readDocument(doc, userUpvoted, id)
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
  
  
  function readDocument(doc: VariantDoc, userUpvoted: boolean, id: string): PublishedVariantGui | undefined {
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
      numUpvotes: doc.IMMUTABLE.numUpvotes,
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
