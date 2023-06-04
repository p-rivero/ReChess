import { updatePrivateCache } from '../user/helpers/update-private-cache'
import { updateVariantUpvotes } from './helpers/update-variant-metrics'

/**
 * Called when a user upvotes a variant. Increments the upvote count of the variant and
 * updates the private cache of the user that upvoted it.
 * @param {string} variantId UID of the variant that was upvoted
 * @param {string} upvoterId UID of the user who upvoted the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string, upvoterId: string): Promise<void> {
  await Promise.all([
    updateVariantUpvotes(variantId, 1),
    updatePrivateCache('upvoteVariant', upvoterId, variantId),
  ])
}
