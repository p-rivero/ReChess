import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { AuthUser, useAuthStore } from '@/stores/auth-user'
import { DEFAULT_ORDER, type VariantListOrder } from '@/utils/chess/variant-search'
import { VariantDB } from '@/firebase/db'
import { parseVariantJson } from '@/utils/chess/variant-json'
import type { PublishedVariant } from '@/protochess/types'
import type { VariantDoc } from '@/firebase/db/schema'

export const useVariantStore = defineStore('variant', () => {
  
  // Currently fetched variants
  const variantList = ref<PublishedVariant[]>([])
  const variantListFetched = ref(false)
  
  let fullVariantList: PublishedVariant[] = []
  let variantListOrder: VariantListOrder = DEFAULT_ORDER
  // Firebase only allows 1 tag. Use the first tag in the list for the query
  // and filter the rest of the tags in the client
  let variantListTag: string|undefined = undefined
  
  const authStore = useAuthStore()
  
  // Fetches the list of variants from the database
  async function refreshList(order: VariantListOrder, tags: string[]) {
    const [primaryTag, ...clientTags] = tags
    await refreshFullList(order, primaryTag)
    
    // Filter the list of variants
    let result = fullVariantList
    for (const tag of clientTags) {
      result = result.filter(variant => variant.tags.some(t => t.startsWith(tag)))
    }
    
    variantList.value = result
    variantListFetched.value = true
  }
  
  async function refreshFullList(order: VariantListOrder, tag: string) {
    // TODO: Add pagination
    // Only fetch the list if it hasn't been fetched yet (or if the order has changed)
    if (variantList.value.length > 0 && variantListOrder === order && variantListTag === tag) {
      return
    }
    
    // Fetch and filter the list of variants
    const docsWithId = await VariantDB.getVariantList(order, tag)
    
    // Convert each pair of documents into a PublishedVariant
    const result = []
    for (const [doc, id] of docsWithId) {
      const state = readVariantDoc(doc, id, authStore.loggedUser)
      const reported = authStore.loggedUser ? authStore.loggedUser.reportedVariants.includes(id) : false
      if (state && !reported) result.push(state)
    }
    fullVariantList = result
    variantListOrder = order
    variantListTag = tag
  }
  
  watch(authStore, async () => {
    // If the user has changed, we need to fetch the upvotes again
    variantList.value.forEach(variant => {
      variant.loggedUserUpvoted = authStore.loggedUser ?
        authStore.loggedUser.upvotedVariants.includes(variant.uid) :
        false
    })
  })
  
  // Gets a variant from the database, or returns undefined if it doesn't exist
  async function getVariant(id: string): Promise<PublishedVariant | undefined> {
    // First check if the variant has already been fetched
    const existingVariant = variantList.value.find(variant => variant.uid === id)
    if (existingVariant) {
      return existingVariant
    }
    
    const doc = await VariantDB.getVariantById(id)
    if (!doc) return undefined
    return readVariantDoc(doc, id, authStore.loggedUser)
  }
  
  // Gets all the variants from a specific creator, in order of creation time
  async function getVariantsFromCreator(userId: string): Promise<PublishedVariant[]> {
    const docsWithId = await VariantDB.getVariantsFromCreator(userId)
    // Fetch whether the user has upvoted each variant simultaneously
    const result = []
    for (const [doc, id] of docsWithId) {
      const state = readVariantDoc(doc, id, authStore.loggedUser)
      if (state) result.push(state)
    }
    return result
  }
  
  // Gets all the variants that the user has upvoted, in order of upvote time
  async function getUpvotedVariants(upvoterId: string): Promise<PublishedVariant[]> {
    const docsWithId = await VariantDB.getUpvotedVariants(upvoterId)
    const result: PublishedVariant[] = []
    for (const [doc, id] of docsWithId) {
      const state = readVariantDoc(doc, id, authStore.loggedUser)
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
  
  async function reportVariant(id: string): Promise<void> {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to report a variant')
    }
    await VariantDB.reportVariant(authStore.loggedUser.uid, id)
  }
  
  return {
    refreshList, getVariant, getVariantsFromCreator,
    getUpvotedVariants, upvote, reportVariant,
    variantList, variantListFetched,
  }
})



/**
 * Converts a variant document into a PublishedVariant. Optionally, the logged user can be provided to check if they have upvoted the variant.
 * @param doc The variant document to convert
 * @param id The ID of the variant document
 * @param user The logged user, if any. Can be obtained from the auth store.
 * @returns The converted variant, or undefined if the document is invalid
 */
export function readVariantDoc(doc: VariantDoc, id: string, user?: AuthUser|null): PublishedVariant | undefined {
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
    loggedUserUpvoted: user ? user.upvotedVariants.includes(id) : false,
    // Overwrite the existing name and description with the ones from the document
    displayName: doc.name,
    description: doc.description,
  }
  return pv
}
