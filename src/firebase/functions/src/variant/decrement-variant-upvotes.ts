import { removeUpvotedVariant } from '../user/helpers/update-private-cache'
import { updateVariantUpvotes } from './helpers/update-variant-metrics'

/**
 * Called when a a user removes their upvote of a variant. Decrements the upvote count of the variant
 * and updates the private cache of the user that removed their upvote.
 * @param {string} variantId UID of the variant that was un-upvoted
 * @param {string} userId UID of the user who un-upvoted the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string, userId: string): Promise<void> {
  await Promise.all([
    updateVariantUpvotes(variantId, -1),
    removeUpvotedVariant(userId, variantId),
  ])
}
