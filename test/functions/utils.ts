import { https } from 'firebase-functions'

export function isHttpsError(e: unknown): e is https.HttpsError {
  if (e === null || typeof e !== 'object') return false
  return e.constructor.name === 'HttpsError'
}

/**
 * Asserts that the given promise throws an HttpsError instead of succeeding
 * @param promise The promise to test
 * @return {Promise<HttpsError>} A promise that resolves to the thrown HttpsError
 * @throws {Error} If the promise does not throw an HttpsError
 */
export async function expectHttpsError(promise: Promise<any>): Promise<https.HttpsError> {
  try {
    await promise
  } catch (e) {
    if (!isHttpsError(e)) {
      throw new Error('should throw an HttpsError, instead got:\n' + e)
    }
    return e
  }
  throw new Error('should throw an HttpsError, instead succeeded')
}

/**
 * Asserts that the given promise succeeds. This only serves to make the test more readable
 */
export async function expectSuccess<T>(promise: Promise<T>): Promise<T> {
  return promise
}


type LogType = 'log' | 'warn' | 'error'

/**
 * Sets a spu on console.warn that asserts that the given message is logged
 * @param expectedMessage The message that should be logged
 * @param expectedTimesCalled The number of times the message should be logged
 * @return {{done: () => void}} An object with a `done` method. Call this method when you
 *    are done testing to assert that the message was logged the expected number of times
 */
export function expectLog(fn: LogType, expectedMessage: string, expectedTimesCalled = 1): {done: () => void} {
  const spy = jest.spyOn(console, fn).mockImplementationOnce((...args) => { 
    const msg = args.join(' ')
    if (msg !== expectedMessage) {
      throw new Error(`Unexpected print:\n${msg}\n\nExpected:\n${expectedMessage}`)
    }
  })
  
  return {
    done() {
      if (spy.mock.calls.length !== expectedTimesCalled) {
        throw new Error(`Expected console.${fn} to be called ${expectedTimesCalled} times, ` +
            `instead called ${spy.mock.calls.length} times`)
      }
      spy.mockRestore()
    }
  }
}
