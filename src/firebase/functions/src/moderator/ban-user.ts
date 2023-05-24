
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
/**
 * Called directly by the moderator in order to ban a user.
 * If the user is already banned, this function does nothing and returns successfully.
 * 
 * This does the following:
 * - Replaces the user's name with "[deleted]" in their profile and all of their variants.
 * - Removes the user's profile picture
 * - Removes the user's about information
 * - Prevents the user from logging in
 * - Expires all of the user's sessions
 * 
 * The user's variants, reports, and upvotes are NOT affected. See `wipe-user.ts` for a more thorough wipe.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that the moderator wishes to ban
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The user to be banned does not exist
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
