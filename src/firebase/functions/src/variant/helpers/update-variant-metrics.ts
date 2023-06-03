import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../../helpers'

/**
 * Increase or decrease the popularity score of a variant.
 * @param {string} variantId The ID of the variant to update
 * @param {string} delta The increment to apply to the popularity score. Can be negative.
 */
export async function updateVariantPopularity(variantId: string, delta: number) {
  const { db } = await useAdmin()
  try {
    await db.collection('variants').doc(variantId).update({
      popularity: FieldValue.increment(delta),
    })
  } catch (e) {
    console.error('Cannot update variant popularity', variantId, e)
  }
}

/**
 * Increase or decrease the number of upvotes of a variant.
 * @param {string} variantId The ID of the variant to update
 * @param {1 | -1} delta The increment to apply to the number of upvotes.
 */
export async function updateVariantUpvotes(variantId: string, delta: 1|-1) {
  const { db } = await useAdmin()
  try {
    await db.collection('variants').doc(variantId).update({
      numUpvotes: FieldValue.increment(delta),
    })
  } catch (e) {
    console.error('Cannot update variant upvotes', variantId, e)
  }
}
