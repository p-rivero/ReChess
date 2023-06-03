import { fetchUserCache } from '../user/helpers/fetch-user'
import { removeUpvotedVariant } from '../user/helpers/update-private-cache'
import { updateVariantUpvotes } from './helpers/update-variant-metrics'

/**
 * Called when a a user removes their upvote of a variant. Decrement the upvote count for the variant.
 * @param {string} variantId UID of the variant that was un-upvoted
 * @param {string} userId UID of the user who un-upvoted the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string, userId: string): Promise<void> {
  const userCacheDoc = await fetchUserCache(userId)
  
  await Promise.all([
    removeUpvotedVariant(userId, variantId, userCacheDoc),
    updateVariantUpvotes(variantId, -1),
  ])
}
