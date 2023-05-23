import admin from 'firebase-admin'
import initFunctions from 'firebase-functions-test'
import { assertEmulatorsRunning } from '../test-common'
import type { FeaturesList } from 'firebase-functions-test/lib/features'

export interface TestUtils {
  app: admin.app.App,
  testEnv: FeaturesList,
}

export const functions = require('../../src/firebase/functions/src/index') as typeof import('../../src/firebase/functions/src/index')

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199"

let currentUtils: TestUtils | null = null
export function initialize(projectId: string): TestUtils {
  const testEnv = initFunctions({ projectId })
  const config = {
    projectId,
    credential: admin.credential.applicationDefault(),
  }
  const app = admin.initializeApp(config, projectId)
  jest.spyOn(admin, 'initializeApp').mockImplementation(
    (config, id) => id === projectId ? app : admin.initializeApp(config, id)
  )
  currentUtils = { app, testEnv }
  return currentUtils
}


// Do not run the functions emulator, since it will interfere with the test.
// You can use: firebase emulators:start --only firestore,storage,auth
beforeAll(assertEmulatorsRunning)

afterEach(async () => {
  async function clearBucket(name: string) {
    const bucket = currentUtils!.app.storage().bucket(name)
    const [files] = await bucket.getFiles()
    await Promise.all(files.map(file => file.delete()))
  }
  async function clearFirestore() {
    const firestore = currentUtils!.app.firestore()
    const collections = await firestore.listCollections()
    for (const collection of collections) {
      const documents = await collection.listDocuments()
      await Promise.all(documents.map(doc => doc.delete()))
    }
  }
  await Promise.all([
    clearBucket('rechess-web.appspot.com'),
    clearBucket('rechess-web-piece-images'),
    clearFirestore(),
  ])
})

afterAll(async () => {
  await currentUtils?.app.delete()
  currentUtils?.testEnv.cleanup()
})

