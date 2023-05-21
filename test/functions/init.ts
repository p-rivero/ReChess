import dotenv from 'dotenv'
import * as admin from 'firebase-admin'
import initFunctions from 'firebase-functions-test'

import { FIREBASE_CONFIG, PIECE_IMAGES_BUCKET_URL } from '../../src/firebase/credentials'

import { FUNCTIONS_REGION } from '../../src/firebase/functions/src/config'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { initializeApp } from 'firebase/app'

const PROJECT_ID = 'functions-test'

dotenv.config({ path: '.config/.env.local' })
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"

const serviceAccount = require('../../.config/admin-key.json')
const config = {
  ...FIREBASE_CONFIG,
  apiKey: process.env.VITE_RECHESS_FIREBASE_API_KEY,
  projectId: PROJECT_ID,
  credential: admin.credential.cert(serviceAccount),
}
// Use the emulator for all services when running tests
const app = initializeApp(config)
connectAuthEmulator(getAuth(app), 'http://localhost:9099')
connectFirestoreEmulator(getFirestore(app), 'localhost', 8080)
connectStorageEmulator(getStorage(app), 'localhost', 9199)
connectStorageEmulator(getStorage(app, PIECE_IMAGES_BUCKET_URL), 'localhost', 9199)
connectFunctionsEmulator(getFunctions(app, FUNCTIONS_REGION), 'localhost', 5001)

admin.initializeApp(config)

const fnTest = initFunctions({ projectId: PROJECT_ID }, '../../.config/admin-key.json')  

// Mock initializeApp before importing functions
jest.spyOn(admin, 'initializeApp').mockReturnValue(admin.app())
const functions = require('../../src/firebase/functions/src/index')

export { admin, fnTest, functions }
