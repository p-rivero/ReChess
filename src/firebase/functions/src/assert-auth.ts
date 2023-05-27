import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import type { AuthData } from 'firebase-functions/lib/common/providers/https'

/**
 * Asserts that the caller is authenticated and that their email is verified.
 * @param {CallableContext} context The context of the cloud function call
 * @return {AuthData} The auth data of the caller
 * @throws An HTTP error is thrown if the caller is not authenticated or their email is not verified
 */
export default function(context: CallableContext): AuthData {
  if (!context.app) {
    throw new HttpsError('unauthenticated', 'The function must be called from an App Check verified app.')
  }
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  if (!context.auth.token.email_verified) {
    throw new HttpsError('unauthenticated', 'The email is not verified.')
  }
  return context.auth
}
