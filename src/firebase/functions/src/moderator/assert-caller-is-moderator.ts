import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'

/**
 * Checks that the caller is a moderator and is calling from an App Check verified app.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error if the caller context is invalid
 */
export default async function(context: CallableContext): Promise<void> {
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
}
