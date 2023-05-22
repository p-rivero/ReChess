import dotenv from 'dotenv'
import admin from 'firebase-admin'
import initFunctions from 'firebase-functions-test'
import { assertEmulatorsRunning } from '../test-common'
import { FIREBASE_CONFIG } from '../../src/firebase/credentials'

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199"

dotenv.config({ path: '.config/.env.local' })

export const fnTest = initFunctions({}, '.config/admin-key.json')  
export const functions = require('../../src/firebase/functions/src/index') as typeof import('../../src/firebase/functions/src/index')

export function initialize(projectId: string) {
  const config = {
    ...FIREBASE_CONFIG,
    projectId,
    apiKey: process.env.VITE_RECHESS_FIREBASE_API_KEY,
    credential: admin.credential.cert(require('../../.config/admin-key.json')),
  }
  admin.initializeApp(config)
  return admin
}


// Do not run the functions emulator, since it will interfere with the test.
// You can use: firebase emulators:start --only firestore,storage,auth
beforeAll(assertEmulatorsRunning)

afterEach(async () => {
  // Delete all files in the storage buckets
  const defaultBucket = admin.storage().bucket()
  const [files] = await defaultBucket.getFiles()
  await Promise.all(files.map(file => file.delete()))
  const pieceImagesBucket = admin.storage().bucket('rechess-web-piece-images')
  const [pieceImages] = await pieceImagesBucket.getFiles()
  await Promise.all(pieceImages.map(file => file.delete()))
  
  // Delete all documents in the firestore
  const firestore = admin.firestore()
  const collections = await firestore.listCollections()
  for (const collection of collections) {
    const documents = await collection.listDocuments()
    await Promise.all(documents.map(doc => doc.delete()))
  }
})

afterAll(async () => {
  await admin.app().delete()
  fnTest.cleanup()
})

