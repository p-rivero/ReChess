import dotenv from 'dotenv'
import * as admin from 'firebase-admin'
import initFunctions from 'firebase-functions-test'

import { FIREBASE_CONFIG } from '../../src/firebase/credentials'

const PROJECT_ID = 'functions-test'

dotenv.config({ path: '.config/.env.local' })
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199"

const config = {
  ...FIREBASE_CONFIG,
  apiKey: process.env.VITE_RECHESS_FIREBASE_API_KEY,
  credential: admin.credential.cert(require('../../.config/admin-key.json')),
}
admin.initializeApp(config)

const fnTest = initFunctions({}, '.config/admin-key.json')  

// Mock initializeApp before importing functions
jest.spyOn(admin, 'initializeApp').mockReturnValue(admin.app())
const functions = require('../../src/firebase/functions/src/index') as typeof import('../../src/firebase/functions/src/index')

export { admin, fnTest, functions }
