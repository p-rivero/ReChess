
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { batchedUpdate, useAdmin } from '../helpers'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator in order to delete a variant.
 * All the games played on the variant are deleted as well.
 * If the variant does not exist, this function does nothing and returns successfully.
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that the moderator wishes to delete
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The variant to be deleted does not exist
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { variantId } = data as { variantId: unknown }
  if (!variantId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  
  // Delete games played on the variant
  const { db } = await useAdmin()
  const games = await db.collection('games').where('IMMUTABLE.variantId', '==', variantId).get()
  await batchedUpdate(games, async (batch, ref) => batch.delete(ref))
  
  // Delete the variant
  await db.collection('variants').doc(variantId).delete()
  await db.collection('variantModeration').doc(variantId).delete()
}
