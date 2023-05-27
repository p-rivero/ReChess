
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { discardReports } from './helpers/discard-reports'
import { useAdmin } from '../helpers'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator when someone reports a user but that report is not useful.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that was reported
 * @param {number[]} data.reportIndexes List of 0-based indexes of the reports to discard (positive integers).
 * Duplicate indexes are ignored.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - There is no variant with the given ID
 * - An element of `reportIndexes` is out of range (`>= variant.reports.length`)
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { userId, reportIndexes } = data as { userId: unknown, reportIndexes: unknown }
  if (!userId || !reportIndexes) {
    throw new HttpsError('invalid-argument', 'The function must be called with a userId and reportIndexes.')
  }
  if (typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'The userId must be a string.')
  }
  const { db } = await useAdmin()
  const moderationDocRef = db.collection('userModeration').doc(userId)
  await discardReports(reportIndexes, moderationDocRef)
}
