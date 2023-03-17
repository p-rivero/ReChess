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
import type { DocumentSnapshot, QuerySnapshot } from "@firebase/firestore"

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
  query: (authType: AuthType, collectionName: string, getQuery?: (col: CollectionReference)=>Query) => Promise<QuerySnapshot>
  // Set the data of a document
  set: (authType: AuthType, data: any, path: string, ...pathSegments: string[]) => Promise<void>
  // Add a new document to a collection
  add: (authType: AuthType, data: any, path: string, ...pathSegments: string[]) => Promise<DocumentData>
  // Remove a single document
  remove: (authType: AuthType, path: string, ...pathSegments: string[]) => Promise<void>
  // 
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

export function setupTestUtils(testEnv: RulesTestEnvironment, myId: string): TestUtilsSignature {
  function getAuth(authType: AuthType|RulesTestContext): firebase.firestore.Firestore {
    // If authType is a RulesTestContext, use it directly
    if (authType instanceof Object) {
      return authType.firestore()
    }
    switch (authType) {
      case 'verified':
        return testEnv.authenticatedContext(myId, { email: 'my@mail.com', email_verified: true }).firestore()
      case 'unverified':
        return testEnv.authenticatedContext(myId, { email: 'my@mail.com', email_verified: false }).firestore()
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
  
  async function set(authType: AuthType|RulesTestContext, data: any, path: string, ...pathSegments: string[]): Promise<void> {
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => set(context, data, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await setDoc(document, data)
  }
  
  async function add<T>(authType: AuthType|RulesTestContext, data: T, path: string, ...pathSegments: string[]): Promise<DocumentData> {
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
    if (authType === 'admin') {
      await testEnv.withSecurityRulesDisabled(context => remove(context, path, ...pathSegments))
      return
    }
    const document = doc(getAuth(authType), path, ...pathSegments)
    await deleteDoc(document)
  }
  
  return { get, query, set, add, remove }
}
