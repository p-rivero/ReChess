import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { DEFAULT_ORDER, type VariantListOrder } from '@/utils/chess/variant-search'
import { VariantDB } from '@/firebase/db'
import { parseVariantJson } from '@/utils/chess/variant-json'
import { useAuthStore } from '@/stores/auth-user'
import type { PublishedVariant } from '@/protochess/types'
import type { VariantDoc } from '@/firebase/db/schema'

export const useVariantStore = defineStore('variant', () => {
  
  // Currently fetched variants
  const variantList = ref<PublishedVariant[]>([])
  const variantListOrder = ref<VariantListOrder>(DEFAULT_ORDER)
  
  const authStore = useAuthStore()
  
  let listUpvotesUid: string | undefined = undefined
  // Fetches the list of variants from the database
  // TODO: Add pagination
  async function refreshList(order: VariantListOrder) {
    // Only fetch the list if it hasn't been fetched yet (or if the order has changed)
    if (variantList.value.length > 0 && variantListOrder.value === order) return
    
    // Fetch the list of variant documents from the database
    const docsWithId = await VariantDB.getVariantList(order)
    
    // Fetch whether the user has upvoted each variant simultaneously
    listUpvotesUid = authStore.loggedUser?.uid
    const userUpvoted = await Promise.all(docsWithId.map(hasUpvoted))
    
    // Convert each pair of documents into a PublishedVariant
    const result = []
    for (const [i, [doc, id]] of docsWithId.entries()) {
      const state = readVariantDoc(doc, userUpvoted[i], id)
      if (state) result.push(state)
      else console.warn('Invalid variant document', doc)
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
  async function getVariant(id: string): Promise<PublishedVariant | undefined> {
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
      // Convert the documents into a PublishedVariant
      if (!doc) return undefined
      return readVariantDoc(doc, userUpvoted, id)
    })
  }
  
  // Gets all the variants from a specific creator, in order of creation time
  async function getVariantsFromCreator(userId: string): Promise<PublishedVariant[]> {
    const docsWithId = await VariantDB.getVariantsFromCreator(userId)
    // Fetch whether the user has upvoted each variant simultaneously
    const userUpvoted = await Promise.all(docsWithId.map(hasUpvoted))
    const result = []
    for (const [i, [doc, id]] of docsWithId.entries()) {
      const state = readVariantDoc(doc, userUpvoted[i], id)
      if (state) result.push(state)
    }
    return result
  }
  
  // Gets all the variants that the user has upvoted, in order of upvote time
  async function getUpvotedVariants(upvoterId: string): Promise<PublishedVariant[]> {
    const docsWithId = await VariantDB.getUpvotedVariants(upvoterId)
    const result: PublishedVariant[] = []
    for (const [doc, id] of docsWithId) {
      const state = readVariantDoc(doc, true, id)
      if (state) result.push(state)
    }
    return result
  }
  
  // Sets or removes an upvote for a variant
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
  
  function hasUpvoted(variant: [VariantDoc, string]): Promise<boolean> {
    const variantId = variant[1]
    return VariantDB.hasUserUpvoted(authStore.loggedUser?.uid, variantId)
  }
  
  return { refreshList, getVariant, getVariantsFromCreator, getUpvotedVariants, upvote, variantList }
})


export function readVariantDoc(doc: VariantDoc, userUpvoted: boolean, id: string): PublishedVariant | undefined {
  const variant = parseVariantJson(doc.initialState)
  if (!variant) {
    console.error('Illegal variant document', doc)
    return undefined
  }
  const pv: PublishedVariant = {
    ...variant,
    uid: id,
    creationTime: doc.creationTime.toDate(),
    creatorDisplayName: doc.creatorDisplayName,
    creatorId: doc.creatorId ?? undefined,
    numUpvotes: doc.numUpvotes,
    popularity: doc.popularity,
    loggedUserUpvoted: userUpvoted,
    // Overwrite the existing name and description with the ones from the document
    displayName: doc.name,
    description: doc.description,
  }
  return pv
}