import type { https } from 'firebase-functions'

/**
 * Creates a mock context for an HTTPS callable function.
 * @param {string|false|undefined} userId The user ID to use for the context.
 * Pass a string to provide a custom ID, or false to make the context unauthenticated.
 * Leave undefined to use the default ID (`test_id`).
 * @param {boolean} appCheck True if the caller has an App Check token.
 * @param {boolean} emailVerified True if the caller's email is verified.
 */
export default function(userId?: string|false, appCheck = true, emailVerified = true): https.CallableContext {
  if (userId === undefined) userId = 'test_id'
  const token = {
    aud: 'test',
    auth_time: 123,
    email_verified: emailVerified,
    exp: 123,
    firebase: {
      identities: {},
      sign_in_provider: 'test',
    },
    iat: 123,
    iss: 'test',
    sub: 'test',
    uid: 'test',
  }
  return {
    auth: userId ? {
      uid: userId,
      token,
    } : undefined,
    app: appCheck ? {
      appId: 'rechess-web',
      token,
      alreadyConsumed: false,
    } : undefined,
    rawRequest: 'test',
  } as unknown as https.CallableContext
}
