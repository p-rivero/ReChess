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
 * Sets a spy on `console.log`, `console.warn` or `console.error` that asserts that
 * the given message is logged the expected number of times.
 * @param expectedMessage The message that should be logged
 * @param expectedTimesCalled The number of times the message should be logged
 * @return {() => void} Call this method when you are done testing.
 *  It asserts that the message was logged the expected number of times.
 */
export function expectLog(fn: LogType, expectedMessage: string, expectedTimesCalled = 1): () => void {
  const spy = jest.spyOn(console, fn).mockImplementation((...args) => {
    const msg = args.join(' ')
    if (msg !== expectedMessage) {
      spy.mockRestore()
      throw new Error(`Unexpected ${fn} print:\n${msg}\n\nExpected:\n${expectedMessage}`)
    }
  })
  
  return () => {
    const numCalls = spy.mock.calls.length
    spy.mockRestore()
    if (numCalls !== expectedTimesCalled) {
      throw new Error(`Expected console.${fn} to be called ${expectedTimesCalled} times, ` +
          `instead called ${numCalls} times`)
    }
  }
}

/**
 * Asserts that `console.warn` and `console.error` are not called during the execution of some code.
 * @return {() => void} Call this method when you are done testing (the console methods can be called again).
 */
export function expectNoErrorLog(): () => void {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
  return () => {
    const errorMsg = errorSpy.mock.calls.at(0)?.join(' ')
    const warnMsg = warnSpy.mock.calls.at(0)?.join(' ')
    errorSpy.mockRestore()
    warnSpy.mockRestore()
    if (errorMsg) {
      throw new Error(`Unexpected ERROR log:\n${errorMsg}`)
    }
    if (warnMsg) {
      throw new Error(`Unexpected WARNING log:\n${warnMsg}`)
    }
  }
}
