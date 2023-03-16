// UTILITIES FOR WRITING SHORTER TESTS

import type firebase from "firebase/compat"
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing"
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

const myId = 'user_abc'
const theirId = 'user_xyz'
const myEmail = 'my@mail.com'



// Pass 'everyone' to repeat the access for all 3 auth types
export type AuthType = 'verified' | 'unverified' | 'not logged' | 'everyone'

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
  // Context for a logged user with a verified email
  function verifiedAuth(): firebase.firestore.Firestore {
    return testEnv.authenticatedContext(myId, { email: myEmail, email_verified: true }).firestore()
  }
  // Context for a logged user with an unverified email
  function unverifiedAuth(): firebase.firestore.Firestore {
    return testEnv.authenticatedContext(myId, { email: myEmail, email_verified: false }).firestore()
  }
  // Context for a user that is not logged in
  function notAuth(): firebase.firestore.Firestore {
    return testEnv.unauthenticatedContext().firestore()
  }
  function getAuth(authType: AuthType): firebase.firestore.Firestore {
    return authType === 'verified' ? verifiedAuth()
      : authType === 'unverified' ? unverifiedAuth()
      : notAuth()
  }
  
  async function get(authType: AuthType, path: string, ...pathSegments: string[]): Promise<DocumentData|DocumentData[]> {
    if (authType === 'everyone') {
      return Promise.all([
        get('verified', path, ...pathSegments),
        get('unverified', path, ...pathSegments),
        get('not logged', path, ...pathSegments),
      ])
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    return await getDoc(document)
  }
  async function query(authType: AuthType, path: string, getQuery?: (col: CollectionReference)=>Query): Promise<DocumentData|DocumentData[]> {
    if (authType === 'everyone') {
      return Promise.all([
        query('verified', path, getQuery),
        query('unverified', path, getQuery),
        query('not logged', path, getQuery),
      ])
    }
    // If no query is provided, return all documents
    if (!getQuery) getQuery = (col) => col
    const col = getAuth(authType).collection(path)
    return await getDocs(getQuery(col))
  }
  async function set(authType: AuthType, data: any, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'everyone') {
      await Promise.all([
        set('verified', data, path, ...pathSegments),
        set('unverified', data, path, ...pathSegments),
        set('not logged', data, path, ...pathSegments),
      ])
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await setDoc(document, data)
  }
  async function add<T>(authType: AuthType, data: T, path: string, ...pathSegments: string[]): Promise<DocumentData|DocumentData[]> {
    if (authType === 'everyone') {
      return Promise.all([
        add('verified', data, path, ...pathSegments),
        add('unverified', data, path, ...pathSegments),
        add('not logged', data, path, ...pathSegments),
      ])
    }
    const col = collection(getAuth(authType), path, ...pathSegments)
    return await addDoc(col, data)
  }
  async function remove(authType: AuthType, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'everyone') {
      await Promise.all([
        // Delete does not fail if the document does not exist
        remove('verified', path, ...pathSegments),
        remove('unverified', path, ...pathSegments),
        remove('not logged', path, ...pathSegments),
      ])
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await deleteDoc(document)
  }
  
  return { get, query, set, add, remove }
}
