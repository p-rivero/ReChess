
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { discardReports } from './helpers/discard-reports'
import { useAdmin } from '../helpers'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator when a variant report is not useful.
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that was reported
 * @param {number[]} data.reportIndexes List of 0-based indexes of the reports to discard (positive integers).
 * Duplicate indexes are ignored.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - There is no variant with the given ID
 * - An element of `reportIndexes` is out of range (`>= user.reports.length`)
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { variantId, reportIndexes } = data as { variantId: unknown, reportIndexes: unknown }
  if (!variantId || !reportIndexes) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId and reportIndexes.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  const { db } = await useAdmin()
  const moderationDocRef = db.collection('variantModeration').doc(variantId)
  await discardReports(reportIndexes, moderationDocRef)
}
