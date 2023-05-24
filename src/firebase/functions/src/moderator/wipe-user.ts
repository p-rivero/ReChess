
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
/**
 * Called directly by the moderator in order to wipe a user's content.
 * If the user is already banned, this function will still wipe their content (if it exists) and return successfully.
 * 
 * This does the following:
 * - Removes all of the user's variants
 * - Removes all of the user's reports
 * - Bans the user (see `ban-user.ts`)
 * 
 * The user's upvotes are NOT removed.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that the moderator wishes to wipe
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The user to be wiped does not exist
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  // Check user authentication
  if (!context.app) {
    throw new HttpsError('unauthenticated', 'The function must be called from an App Check verified app.')
  }
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  if (!context.auth.token.moderator) {
    throw new HttpsError('unauthenticated', 'The user must be a moderator.')
  }
  
  // Validate input
  const { userId } = data as { userId: unknown }
  if (!userId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a userId.')
  }
  if (typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'The userId must be a string.')
  }
  if (context.auth.uid === userId) {
    throw new HttpsError('invalid-argument', 'Please do not ban yourself :(')
  }
  
  // TODO
}
