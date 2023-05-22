import { https } from 'firebase-functions'

export function isHttpsError(e: unknown): e is https.HttpsError {
  if (e === null || typeof e !== 'object') return false
  return e.constructor.name === 'HttpsError'
}

export async function expectHttpsError(promise: Promise<any>): Promise<https.HttpsError> {
  try {
    await promise
    fail('should throw')
  } catch (e) {
    if (!isHttpsError(e)) {
      fail('should throw an HttpsError, instead got:\n' + e)
    }
    return e
  }
}
