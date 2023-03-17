// UTILITIES FOR WRITING SHORTER TESTS

import type firebase from "firebase/compat"
import type { RulesTestContext, RulesTestEnvironment } from "@firebase/rules-unit-testing"
import {
  doc,
  collection,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore"
import type { CollectionReference, DocumentData, Query } from "@firebase/firestore-types"
import type { QuerySnapshot } from "@firebase/firestore"

const myId = 'user_abc'
const theirId = 'user_xyz'
const myEmail = 'my@mail.com'


/**
- `verified`: logged user with a verified email
- `unverified`: logged user with an unverified email
- `not logged`: user that is not logged in
- `everyone`: repeat the access for all 3 auth types and succeed if all of them succeed.
  Use it along with `assertSucceeds` to test that the access is allowed for everyone
- `someone`: repeat the access for all 3 auth types and succeed if any of them succeed.
  Use it along with `assertFails` to test that the access is denied for everyone
- `admin`: access the database without any restrictions (for setting up the database before the test)
*/
export type AuthType = 'verified' | 'unverified' | 'not logged' | 'everyone' | 'someone' | 'admin'


export type TestUtilsSignature = {
  // Get a single document
  get: (authType: AuthType, path: string, ...pathSegments: string[]) => Promise<DocumentData|DocumentData[]>
  // Perform a query on a collection
  query: (authType: AuthType, collectionName: string, getQuery?: (col: CollectionReference)=>Query) => Promise<DocumentData|DocumentData[]>
  // Set the data of a document
  set: (authType: AuthType, data: any, path: string, ...pathSegments: string[]) => Promise<void>
  // Add a new document to a collection
  add: (authType: AuthType, data: any, path: string, ...pathSegments: string[]) => Promise<DocumentData|DocumentData[]>
  // Remove a single document
  remove: (authType: AuthType, path: string, ...pathSegments: string[]) => Promise<void>
}



export function notInitialized(): TestUtilsSignature {
  return {
    get: () => Promise.reject('Test environment not initialized'),
    query: () => Promise.reject('Test environment not initialized'),
    set: () => Promise.reject('Test environment not initialized'),
    add: () => Promise.reject('Test environment not initialized'),
    remove: () => Promise.reject('Test environment not initialized'),
  }
}

export function setupTestUtils(testEnv: RulesTestEnvironment): TestUtilsSignature {
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
  // Replacement for Promise.any()
  function tryAny<T>(promises: Promise<T>[]): Promise<T> {
    return new Promise((resolve, reject) => {
      let rejected = 0
      for (const promise of promises) {
        promise.then(resolve).catch(() => {
          rejected++
          // assertFails() is looking for 'permission_denied', 'permission denied' or 'unauthorized'
          if (rejected === promises.length) {
            reject(new Error('PERMISSION_DENIED'))
          }
        })
      }
    })
  }
  
  
  async function get(authType: AuthType, path: string, ...pathSegments: string[]): Promise<DocumentData|DocumentData[]> {
    if (authType === 'everyone') {
      return Promise.all([
        get('verified', path, ...pathSegments),
        get('unverified', path, ...pathSegments),
        get('not logged', path, ...pathSegments),
      ])
    }
    if (authType === 'someone') {
      return tryAny([
        get('verified', path, ...pathSegments),
        get('unverified', path, ...pathSegments),
        get('not logged', path, ...pathSegments),
      ])
    }
    if (authType === 'admin') {
      throw new Error('admin is not allowed for read operations')
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    return await getDoc(document)
  }
  
  async function query(authType: AuthType, path: string, getQuery?: (col: CollectionReference)=>Query): Promise<QuerySnapshot|QuerySnapshot[]> {
    if (authType === 'everyone') {
      return Promise.all([
        query('verified', path, getQuery),
        query('unverified', path, getQuery),
        query('not logged', path, getQuery),
      ]) as Promise<QuerySnapshot[]>
    }
    if (authType === 'someone') {
      return tryAny([
        query('verified', path, getQuery),
        query('unverified', path, getQuery),
        query('not logged', path, getQuery),
      ])
    }
    if (authType === 'admin') {
      throw new Error('admin is not allowed for read operations')
    }
    // If no query is provided, return all documents
    if (!getQuery) getQuery = (col) => col
    const col = getAuth(authType).collection(path)
    return await getDocs(getQuery(col))
  }
  
  async function set(authType: AuthType|RulesTestContext, data: any, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'everyone') {
      await Promise.all([
        set('verified', data, path, ...pathSegments),
        set('unverified', data, path, ...pathSegments),
        set('not logged', data, path, ...pathSegments),
      ])
      return
    }
    if (authType === 'someone') {
      await tryAny([
        set('verified', data, path, ...pathSegments),
        set('unverified', data, path, ...pathSegments),
        set('not logged', data, path, ...pathSegments),
      ])
      return
    }
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => set(context, data, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await setDoc(document, data)
  }
  
  async function add<T>(authType: AuthType|RulesTestContext, data: T, path: string, ...pathSegments: string[]): Promise<DocumentData|DocumentData[]> {
    if (authType === 'everyone') {
      return Promise.all([
        add('verified', data, path, ...pathSegments),
        add('unverified', data, path, ...pathSegments),
        add('not logged', data, path, ...pathSegments),
      ])
    }
    if (authType === 'someone') {
      return tryAny([
        add('verified', data, path, ...pathSegments),
        add('unverified', data, path, ...pathSegments),
        add('not logged', data, path, ...pathSegments),
      ])
    }
    if (authType === 'admin') {
      let result: DocumentData | undefined = undefined
      await testEnv.withSecurityRulesDisabled(async context => {
        result = add(context, data, path, ...pathSegments)
      })
      return result!
    }
    const col = collection(getAuth(authType), path, ...pathSegments)
    return await addDoc(col, data)
  }
  
  async function remove(authType: AuthType|RulesTestContext, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'everyone') {
      await Promise.all([
        // Delete does not fail if the document does not exist
        remove('verified', path, ...pathSegments),
        remove('unverified', path, ...pathSegments),
        remove('not logged', path, ...pathSegments),
      ])
      return
    }
    if (authType === 'someone') {
      await tryAny([
        remove('verified', path, ...pathSegments),
        remove('unverified', path, ...pathSegments),
        remove('not logged', path, ...pathSegments),
      ])
      return
    }
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => remove(context, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await deleteDoc(document)
  }
  
  return { get, query, set, add, remove }
}
