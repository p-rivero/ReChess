import dotenv from 'dotenv'
import * as admin from 'firebase-admin'
import initFunctions from 'firebase-functions-test'

import { FIREBASE_CONFIG } from '../../src/firebase/credentials'

const PROJECT_ID = 'functions-test'

//! IMPORTANT: Do not run the functions emulator, since it will interfere with the test.
//! You can use: firebase emulators:exec --only firestore,storage,auth 'npm test'
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199"

dotenv.config({ path: '.config/.env.local' })
const config = {
  ...FIREBASE_CONFIG,
  projectId: PROJECT_ID,
  apiKey: process.env.VITE_RECHESS_FIREBASE_API_KEY,
  credential: admin.credential.cert(require('../../.config/admin-key.json')),
}
admin.initializeApp(config)

const fnTest = initFunctions({}, '.config/admin-key.json')  

// Mock initializeApp before importing functions
jest.spyOn(admin, 'initializeApp').mockReturnValue(admin.app())
const functions = require('../../src/firebase/functions/src/index') as typeof import('../../src/firebase/functions/src/index')

export { admin, fnTest, functions }
