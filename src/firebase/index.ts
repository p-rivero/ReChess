import { CAPTCHA_V3_PUBLIC_KEY, FIREBASE_CONFIG, PIECE_IMAGES_BUCKET_URL } from './credentials'

// https://firebase.google.com/docs/web/setup#available-libraries
import { FUNCTIONS_REGION } from './functions/src/config'
import { ReCaptchaV3Provider, initializeAppCheck } from 'firebase/app-check'
import { browserLocalPersistence, connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { getPerformance } from 'firebase/performance'
import { initializeApp } from 'firebase/app'

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined
}

// Initialize Firebase
const app = initializeApp({ apiKey: import.meta.env.VITE_RECHESS_FIREBASE_API_KEY, ...FIREBASE_CONFIG })
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
type CreateGameParams = { variantId: string, lobbySlotCreatorId: string }
export const createGame = httpsCallable<CreateGameParams, { gameId: string }>(functions, 'createGame')

type CancelGameParams = { gameId: string, reason: string }
export const cancelGame = httpsCallable<CancelGameParams, void>(functions, 'cancelGame')

type BanUserParams = { userId: string }
export const banUser = httpsCallable<BanUserParams, void>(functions, 'cancelGame')

type DeleteVariantParams = { variantId: string }
export const deleteVariant = httpsCallable<DeleteVariantParams, void>(functions, 'deleteVariant')

type DiscardUserReportParams = { userId: string }
export const discardUserReport = httpsCallable<DiscardUserReportParams, void>(functions, 'discardUserReport')

type DiscardVariantReportParams = { variantId: string }
export const discardVariantReport = httpsCallable<DiscardVariantReportParams, void>(functions, 'discardVariantReport')

type WipeUserParams = { userId: string }
export const wipeUser = httpsCallable<WipeUserParams, void>(functions, 'wipeUser')
