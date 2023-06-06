import type { https, EventContext } from 'firebase-functions'

/**
 * Creates a mock context for an HTTPS callable function.
 * @param {string|false|undefined} userId The user ID to use for the context.
 * Pass a string to provide a custom ID, or null to make the context unauthenticated.
 * @param {boolean} appCheck True if the caller has an App Check token.
 * @param {boolean} emailVerified True if the caller's email is verified.
 */
export function makeCallableContext(userId: string|null, appCheck = true, emailVerified = true, customClaims?: object): https.CallableContext {
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
    ...customClaims,
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

/**
 * Creates a mock context for firebase trigger.
 * @param {T} pathParams The values of the wildcards in the path.
 */
export function makeFirestoreContext<T>(pathParams: T): EventContext<T> {
  return {
    eventId: 'event_id',
    timestamp: 'timestamp',
    params: pathParams,
    resource: {
      name: 'test',
      service: 'test',
    },
  } as unknown as EventContext<T>
}
