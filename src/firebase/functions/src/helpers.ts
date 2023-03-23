
// True if the admin SDK has been initialized for this cloud function instance
let adminInitialized = false

/**
 * Lazy load the admin SDK and initialize it if it hasn't been already
 * @return {app} The admin SDK
 */
export async function useAdmin(): Promise<typeof admin> {
  // See https://youtu.be/v3eG9xpzNXM
  const admin = await import('firebase-admin')
  if (!adminInitialized) {
    console.log('Initializing admin SDK')
    admin.initializeApp()
    adminInitialized = true
  }
  return admin
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Calls the default export of a module. This is useful for lazy loading cloud functions.
 * Since functions are async, this returns a promise of a promise. It should be fine since promises auto-flatten.
 *
 * @param {Promise<{ default: F }>} modulePromise An `import()` call to a module that exports a function
 *
 * @param {any[]} args Arguments to pass to the function
 *
 * @return {Promise<ReturnType<F>>} A promise of the return value of the function
 *
*/
export async function callFunction< F extends(..._args: any[]) => Promise<any> >
(modulePromise: Promise<{ default: F }>, ...args: Parameters<F>): Promise<ReturnType<F>> {
  const mod = await modulePromise
  return mod.default(...args)
}
