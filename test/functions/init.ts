import admin from 'firebase-admin'
import initFunctions from 'firebase-functions-test'
import { assertEmulatorsRunning } from '../test-common'
import { injectApp } from '@/firebase/functions/src/helpers'
import type { FeaturesList } from 'firebase-functions-test/lib/features'

export * as functions from '../../src/firebase/functions/src/index'

export interface TestUtils {
  app: admin.app.App,
  testEnv: FeaturesList,
}

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199"

let currentUtils: TestUtils | null = null
export function initialize(projectId: string): TestUtils {
  const testEnv = initFunctions({ projectId })
  const config: admin.AppOptions = {
    projectId,
    storageBucket: `${projectId}.appspot.com`,
    credential: admin.credential.applicationDefault(),
  }
  const app = admin.initializeApp(config, projectId)
  jest.spyOn(injectApp, 'getAdminReturn').mockImplementation((admin, defaultApp) => ({
    db: admin.firestore(defaultApp),
    storage: admin.storage(app),
    auth: admin.auth(app),
  }))
  currentUtils = { app, testEnv }
  return currentUtils
}


// Do not run the functions emulator, since it will interfere with the test.
// You can use: firebase emulators:start --only firestore,storage,auth
beforeAll(assertEmulatorsRunning)

afterEach(async () => {
  const db = currentUtils!.app.firestore()
  const storage = currentUtils!.app.storage()
  async function clearStorage() {
    const [files] = await storage.bucket().getFiles()
    await Promise.all(files.map(file => file.delete()))
  }
  async function clearCollection(collectionPath: string) {
    const docs = await db.collection(collectionPath).listDocuments()
    await Promise.all(docs.map(async doc => {
      const subcollections = await doc.listCollections()
      for (const subcollection of subcollections) {
        await clearCollection(subcollection.path)
      }
      await doc.delete()
    }))
  }
  async function clearFirestore() {
    const collections = await db.listCollections()
    for (const collection of collections) {
      await clearCollection(collection.path)
    }
  }
  async function clearAuth() {
    const auth = currentUtils!.app.auth()
    const users = await auth.listUsers()
    await Promise.all(users.users.map(user => auth.deleteUser(user.uid)))
  }
  await Promise.all([
    clearStorage(),
    clearFirestore(),
    clearAuth(),
  ])
})

afterAll(async () => {
  currentUtils?.testEnv.cleanup()
  await currentUtils?.app.delete()
})

