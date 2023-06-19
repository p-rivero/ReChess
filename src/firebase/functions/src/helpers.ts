import { MAX_BATCH_SIZE } from './config'
import type * as admin from 'firebase-admin'
import type { App } from 'firebase-admin/lib/app'
import type { DocumentReference, QuerySnapshot, WriteBatch } from 'firebase-admin/lib/firestore'

// True if the admin SDK has been initialized for this cloud function instance
let appInstance: App | null = null


export interface UseAdminReturn {
  db: admin.firestore.Firestore,
  storage: admin.storage.Storage,
  auth: admin.auth.Auth
}

type AdminType = typeof import('firebase-admin')
export const injectApp = {
  // Mocked in cloud functions tests
  getAdminReturn(admin: AdminType, app: App): UseAdminReturn {
    return {
      db: admin.firestore(app),
      storage: admin.storage(app),
      auth: admin.auth(app),
    }
  },
}

/**
 * Lazy load the admin SDK and initialize it if it hasn't been already
 * @return {app} The admin SDK
 */
export async function useAdmin(): Promise<UseAdminReturn> {
  // See https://youtu.be/v3eG9xpzNXM
  const admin = await import('firebase-admin')
  if (!appInstance) {
    appInstance = admin.initializeApp()
  }
  return injectApp.getAdminReturn(admin, appInstance)
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
export async function callFunction< F extends(...args: any[]) => Promise<any> >
(modulePromise: Promise<{ default: F }>, ...args: Parameters<F>): Promise<ReturnType<F>> {
  const mod = await modulePromise
  return mod.default(...args)
}

type BatchUpdateInput = QuerySnapshot | DocumentReference[]
type BatchCallback = (batch: WriteBatch, ref: DocumentReference, index: number) => void

/**
 * Generic function to perform a batched update of possibly more than 500 documents.
 * @param {QuerySnapshot|DocumentReference[]} input The list of documents to update
 * @param {BatchCallback} operation A function that is called for each document in the snapshot.
 * It should add the required update to the batch.
 * @return {Promise<void>} A promise that resolves when all the batches have been committed
*/
export async function batchedUpdate(input: BatchUpdateInput, operation: BatchCallback): Promise<void> {
  const { db } = await useAdmin()
  // Convert QuerySnapshot to DocumentReference[]
  if (!Array.isArray(input)) input = input.docs.map((doc) => doc.ref)
  
  const numDocs = input.length
  const numBatches = Math.ceil(numDocs / MAX_BATCH_SIZE)
  if (numBatches > 1) {
    console.info(`Batching ${numDocs} documents into ${numBatches} batches`)
  }
  for (let nBatch = 0; nBatch < numBatches; nBatch++) {
    const batch = db.batch()
    for (let i = 0; i < MAX_BATCH_SIZE; i++) {
      const index = nBatch * MAX_BATCH_SIZE + i
      const ref = input.at(index)
      if (!ref) break
      operation(batch, ref, index)
    }
    await batch.commit()
  }
}
