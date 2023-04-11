// UTILITIES FOR WRITING SHORTER TESTS

import type firebase from 'firebase/compat'
import type { RulesTestContext, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import {
  doc,
  collection,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore'
import type { CollectionReference, FieldValue, Query, DocumentData, UpdateData } from '@firebase/firestore-types'
import { DocumentSnapshot, QuerySnapshot, WriteBatch, Timestamp, DocumentReference, updateDoc, writeBatch, serverTimestamp } from '@firebase/firestore'

/**
- `verified`: logged user with a verified email
- `unverified`: logged user with an unverified email
- `not logged`: user that is not logged in
- `admin`: access the database without any restrictions (for setting up the database before the test)
*/
export type AuthType = 'verified' | 'unverified' | 'not logged' | 'admin'


export type TestUtilsSignature = {
  // Get a single document
  get: (authType: AuthType, path: string, ...pathSegments: string[]) => Promise<DocumentSnapshot>
  // Perform a query on a collection
  query: (authType: AuthType, collectionPath: string, getQuery?: (col: CollectionReference)=>Query) => Promise<QuerySnapshot>
  // Set the data of a document
  set: (authType: AuthType, data: DocumentData, path: string, ...pathSegments: string[]) => Promise<void>
  // Replaces a single field or sub-field ('foo.bar') of the document. Fails if the document does not exist
  update: (authType: AuthType, data: UpdateData, path: string, ...pathSegments: string[]) => Promise<void>
  // Add a new document to a collection
  add: (authType: AuthType, data: DocumentData, path: string, ...pathSegments: string[]) => Promise<DocumentData>
  // Remove a single document
  remove: (authType: AuthType, path: string, ...pathSegments: string[]) => Promise<void>
  // Returns the current server timestamp
  now: () => FieldValue
  // Returns a timestamp that is some seconds in the future
  afterSeconds: (seconds: number) => Timestamp
  // Start a batch write
  startBatch: (authType: AuthType) => Batch
}

export class Batch {
  batch: WriteBatch
  db: firebase.firestore.Firestore
  constructor(batch: WriteBatch, db: firebase.firestore.Firestore) {
    this.batch = batch
    this.db = db
  }
  set(data: DocumentData, path: string, ...pathSegments: string[]) {
    this.batch.set(doc(this.db, path, ...pathSegments), data)
  }
  remove(path: string, ...pathSegments: string[]) {
    this.batch.delete(doc(this.db, path, ...pathSegments))
  }
  async commit() {
    return this.batch.commit()
  }
}


export function notInitialized(): TestUtilsSignature {
  return {
    get: () => Promise.reject('Test environment not initialized'),
    query: () => Promise.reject('Test environment not initialized'),
    set: () => Promise.reject('Test environment not initialized'),
    update: () => Promise.reject('Test environment not initialized'),
    add: () => Promise.reject('Test environment not initialized'),
    remove: () => Promise.reject('Test environment not initialized'),
    now: () => {throw new Error('Test environment not initialized')},
    afterSeconds: () => {throw new Error('Test environment not initialized')},
    startBatch: () => {throw new Error('Test environment not initialized')},
  }
}

export function setupTestUtils(testEnv: RulesTestEnvironment, myId: string, myEmail: string): TestUtilsSignature {
  function getAuth(authType: AuthType|RulesTestContext): firebase.firestore.Firestore {
    // If authType is a RulesTestContext, use it directly
    if (authType instanceof Object) {
      return authType.firestore()
    }
    switch (authType) {
    case 'verified':
      return testEnv.authenticatedContext(myId, { email: myEmail, email_verified: true }).firestore()
    case 'unverified':
      return testEnv.authenticatedContext(myId, { email: myEmail, email_verified: false }).firestore()
    case 'not logged':
      return testEnv.unauthenticatedContext().firestore()
    default:
      throw new Error(`Invalid auth type: ${authType}`)
    }
  }
  
  async function get(authType: AuthType, path: string, ...pathSegments: string[]): Promise<DocumentSnapshot> {
    if (authType === 'admin') {
      throw new Error('admin is not allowed for read operations')
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    return await getDoc(document)
  }
  
  async function query(authType: AuthType, path: string, getQuery?: (col: CollectionReference)=>Query): Promise<QuerySnapshot> {
    if (authType === 'admin') {
      throw new Error('admin is not allowed for read operations')
    }
    // If no query is provided, return all documents
    if (!getQuery) getQuery = (col) => col
    const col = getAuth(authType).collection(path)
    return await getDocs(getQuery(col))
  }
  
  async function set(authType: AuthType|RulesTestContext, data: DocumentData, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => set(context, data, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await setDoc(document, data)
  }
  
  async function update(authType: AuthType|RulesTestContext, data: UpdateData, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => update(context, data, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await updateDoc(document, data)
  }
  
  async function add(authType: AuthType|RulesTestContext, data: DocumentData, path: string, ...pathSegments: string[]): Promise<DocumentReference> {
    if (authType === 'admin') {
      let result: DocumentReference | undefined = undefined
      await testEnv.withSecurityRulesDisabled(async context => {
        result = await add(context, data, path, ...pathSegments)
      })
      if (!result) throw new Error('add() returned undefined')
      return result
    }
    const col = collection(getAuth(authType), path, ...pathSegments)
    return await addDoc(col, data)
  }
  
  async function remove(authType: AuthType|RulesTestContext, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => remove(context, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await deleteDoc(document)
  }
  
  function now(): FieldValue {
    return serverTimestamp()
  }
  
  function afterSeconds(seconds: number): Timestamp {
    return Timestamp.fromDate(new Date(Date.now() + seconds * 1000))
  }
  
  function startBatch(authType: AuthType): Batch {
    const firestore = getAuth(authType)
    return new Batch(writeBatch(firestore), firestore)
  }
  
  return { get, query, set, update, add, remove, now, afterSeconds, startBatch }
}


// Redefine assertSucceeds to throw a new error. This improves linting when using the Jest VSCode extension
import { assertSucceeds as originalAssertSucceeds } from '@firebase/rules-unit-testing'
export async function assertSucceeds<T>(pr: Promise<T>): Promise<T> {
  try {
    return await originalAssertSucceeds(pr)
  } catch (e) {
    throw new Error('Call failed: ' + e)
  }
}
export { assertFails } from '@firebase/rules-unit-testing'
