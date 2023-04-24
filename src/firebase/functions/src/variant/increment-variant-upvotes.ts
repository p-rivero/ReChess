
import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../helpers'

/**
 * Called when a a user upvotes a variant. Increment the upvote count for the variant.
 * @param {string} variantId UID of the variant that was upvoted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  db.collection('variants')
    .doc(variantId)
    .update('numUpvotes', FieldValue.increment(1))
    .catch((err) => {
      console.error('Error while incrementing variant upvotes for variant', variantId + ':')
      console.error(err)
    })
}
