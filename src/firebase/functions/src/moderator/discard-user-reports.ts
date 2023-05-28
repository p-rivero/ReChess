
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { discardReports } from './helpers/discard-reports'
import { useAdmin } from '../helpers'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator when someone reports a user but that report is not useful.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that was reported
 * @param {string[]} data.reporters For each report to remove, the username of the reporter.
 * Duplicates and non-existent reporters are ignored.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if the user is not authenticated as a moderator,
 * or if there is no variant with the given ID.
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { userId, reporters } = data as { userId: unknown, reporters: unknown }
  if (!userId || !reporters) {
    throw new HttpsError('invalid-argument', 'The function must be called with a userId and reporters.')
  }
  if (typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'The userId must be a string.')
  }
  const { db } = await useAdmin()
  const moderationDocRef = db.collection('userModeration').doc(userId)
  await discardReports(reporters, moderationDocRef)
}
