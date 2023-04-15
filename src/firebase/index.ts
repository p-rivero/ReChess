import { FIREBASE_CONFIG, CAPTCHA_V3_PUBLIC_KEY, PIECE_IMAGES_BUCKET_URL } from './credentials'

// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getPerformance } from 'firebase/performance'
import { getAuth, connectAuthEmulator, browserLocalPersistence } from 'firebase/auth'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { FUNCTIONS_REGION } from './functions/src/config'

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined
}

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG)
export const db = getFirestore(app)
export const defaultStorage = getStorage(app)
export const pieceStorage = getStorage(app, PIECE_IMAGES_BUCKET_URL)
export const auth = getAuth(app)
const functions = getFunctions(app, FUNCTIONS_REGION)
const _perf = getPerformance(app)

auth.setPersistence(browserLocalPersistence)

// In development, use the emulator
if (import.meta.env.DEV) {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(defaultStorage, 'localhost', 9199)
  connectStorageEmulator(pieceStorage, 'localhost', 9199)
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

// Enable multi-tab persistence only in production, since the emulator is cleared on every restart
// and the cached data would be out of sync
if (!import.meta.env.DEV) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence could not be enabled because another tab is already open')
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does NOT support firestore persistence.')
    }
  })
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(CAPTCHA_V3_PUBLIC_KEY),
  isTokenAutoRefreshEnabled: true,
})


// Export references to the callable functions
type CreateGameParams = {variantId: string, creatorId: string}
type CreateGameResult = {gameId: string}
export const createGame = httpsCallable<CreateGameParams, CreateGameResult>(functions, 'createGame')

type CancelGameParams = {gameId: string, reason: string}
type CancelGameResult = void
export const cancelGame = httpsCallable<CancelGameParams, CancelGameResult>(functions, 'cancelGame')
