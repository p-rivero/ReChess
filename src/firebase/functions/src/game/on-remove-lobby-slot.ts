import { updateVariantPopularity } from '../variant/helpers/update-variant-metrics'

/**
 * Called when a lobby slot document is deleted. Updates the variant popularity (-3 points).
 * @param {Change<QueryDocumentSnapshot>} variantId ID of the variant for which the lobby slot was deleted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string): Promise<void> {
  await updateVariantPopularity(variantId, -3)
}
