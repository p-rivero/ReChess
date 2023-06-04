import { fetchUserCache } from './fetch-user'
import { useAdmin } from '../../helpers'
import type { UserPrivateCacheDoc } from 'db/schema'

export type UpdateCacheMode = 'upvoteVariant' | 'reportVariant' | 'reportUser'

/**
 * Updates the private cache of the user that upvoted or reported a variant or user.
 * @param {UpdateCacheMode} mode The action to perform
 * @param {string} userId UID of the user who upvoted or reported the variant
 * @param {string} variantOrUserId UID of the variant or user that was upvoted or reported
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function updatePrivateCache(mode: UpdateCacheMode, userId: string, variantOrUserId: string) {
  const userCacheDoc = await loadCache(userId)
  
  switch (mode) {
  case 'upvoteVariant':
    userCacheDoc.upvotedVariants += ' ' + variantOrUserId
    break
  case 'reportVariant':
    userCacheDoc.reportedVariants += ' ' + variantOrUserId
    break
  case 'reportUser':
    userCacheDoc.reportedUsers += ' ' + variantOrUserId
    break
  default:
    throw new Error('Invalid mode: ' + mode)
  }
  
  await storeCache(userId, userCacheDoc)
}

/**
 * Removes a variant from the `upvotedVariants` list of a user's private cache.
 * @param {string} userId UID of the user whose cache to update
 * @param {string} variantId UID of the variant to remove
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function removeUpvotedVariant(userId: string, variantId: string) {
  const userCacheDoc = await loadCache(userId)
  const newUpvotes = userCacheDoc.upvotedVariants.split(' ').filter((id) => id && id !== variantId).join(' ')
  
  if (newUpvotes.length === userCacheDoc.upvotedVariants.length) {
    await handleUpvotedVariantNotFound(userId, variantId, userCacheDoc)
    return
  }
  await updateCacheUpvotes(userId, newUpvotes)
}

async function loadCache(userId: string): Promise<UserPrivateCacheDoc> {
  const userCacheDoc = await fetchUserCache(userId)
  if (userCacheDoc) return userCacheDoc
  return {
    upvotedVariants: '',
    reportedVariants: '',
    reportedUsers: '',
  }
}

/**
 * Stores the private cache of a user without performing any changes.
 * @param {string} userId UID of the user whose cache to update
 * @param {UserPrivateCacheDoc} userCacheDoc The new cache document
 */
export async function storeCache(userId: string, userCacheDoc: UserPrivateCacheDoc) {
  const { db } = await useAdmin()
  try {
    await db.collection('users').doc(userId).collection('privateCache').doc('doc').set(userCacheDoc)
  } catch (err) {
    console.error(`Error while updating cache for user ${userId}:`)
    console.error(err)
  }
}

async function updateCacheUpvotes(userId: string, newUpvotes: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('users').doc(userId).collection('privateCache').doc('doc').update({
      upvotedVariants: newUpvotes,
    })
  } catch (err) {
    console.error(`Error while removing upvoted variant for user ${userId}:`)
    console.error(err)
  }
}

async function handleUpvotedVariantNotFound(userId: string, variantId: string, ourCache: UserPrivateCacheDoc) {
  // This could happen if the user upvotes and then immediately un-upvotes a variant.
  // If the upvote function is slower, the read cache will not exist or will not have the variant.
  // Give the other function some time to write the user's private cache, then write our version.
  console.warn('Overriding cache!', userId, variantId)
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await storeCache(userId, ourCache)
}
