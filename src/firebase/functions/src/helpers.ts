import { MAX_BATCH_SIZE } from './config'
import type { App } from 'firebase-admin/lib/app'

// True if the admin SDK has been initialized for this cloud function instance
let appInstance: App | null = null

/**
 * Lazy load the admin SDK and initialize it if it hasn't been already
 * @return {app} The admin SDK
 */
export async function useAdmin() {
  // See https://youtu.be/v3eG9xpzNXM
  const admin = await import('firebase-admin')
  if (!appInstance) {
    appInstance = admin.initializeApp()
  }
  return {
    db: admin.firestore(appInstance),
    storage: admin.storage(appInstance),
    auth: admin.auth(appInstance),
  }
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

type QuerySnapshot = FirebaseFirestore.QuerySnapshot
type WriteBatch = FirebaseFirestore.WriteBatch
type DocumentReference = FirebaseFirestore.DocumentReference
type BatchCallback = (batch: WriteBatch, ref: DocumentReference) => unknown | Promise<unknown>

/**
 * Generic function to perform a batched update of possibly more than 500 documents.
 * @param {QuerySnapshot} input A query snapshot of the documents to update
 * @param {BatchCallback} operation A function that is called for each document in the snapshot.
 * It should add the required update to the batch.
 * @return {Promise<void>} A promise that resolves when all the batches have been committed
*/
export async function batchedUpdate(input: QuerySnapshot, operation: BatchCallback): Promise<void> {
  const { db } = await useAdmin()
  const numDocs = input.size
  const numBatches = Math.ceil(numDocs / MAX_BATCH_SIZE)
  if (numBatches > 1) {
    console.info(`Batching ${numDocs} documents into ${numBatches} batches`)
  }
  for (let nBatch = 0; nBatch < numBatches; nBatch++) {
    const batch = db.batch()
    for (let i = 0; i < MAX_BATCH_SIZE; i++) {
      const doc = input.docs[nBatch * MAX_BATCH_SIZE + i]
      if (!doc) break
      await operation(batch, doc.ref)
    }
    await batch.commit()
  }
}
