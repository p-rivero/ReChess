
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
/**
 * Called directly by the moderator in order to delete a variant.
 * All the games played on the variant are deleted as well, and the players' game
 * caches and points are updated accordingly.
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that the moderator wishes to delete
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The variant to be deleted does not exist
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
