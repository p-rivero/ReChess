import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import assertAuth from '../../assert-auth'
import type { AuthData } from 'firebase-functions/lib/common/providers/https'

/**
 * Checks that the caller is a moderator and is calling from an App Check verified app.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error if the caller context is invalid (not authenticated as a moderator)
 */
export default function(context: CallableContext): AuthData {
  const auth = assertAuth(context)
  if (!auth.token.moderator) {
    throw new HttpsError('permission-denied', 'The user must be a moderator.')
  }
  return auth
}
