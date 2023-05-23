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

export function expectWarn(expectedMessage: string, expectedTimesCalled = 1) {
  const spy = jest.spyOn(console, 'warn').mockImplementationOnce((...args) => { 
    const msg = args.join(' ')
    if (msg !== expectedMessage) {
      throw new Error(`Unexpected warning:\n${msg}\n\nExpected:\n${expectedMessage}`)
    }
  })
  
  return {
    done() {
      if (spy.mock.calls.length !== expectedTimesCalled) {
        throw new Error(`Expected console.warn to be called ${expectedTimesCalled} times, ` +
            `instead called ${spy.mock.calls.length} times`)
      }
      spy.mockRestore()
    }
  }
}
