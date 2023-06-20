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
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined //NOSONAR
}

// Initialize Firebase
const app = initializeApp(
  { apiKey: import.meta.env.VITE_RECHESS_FIREBASE_API_KEY, ...FIREBASE_CONFIG },
  { automaticDataCollectionEnabled: false }
)
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
interface CreateGameParams { variantId: string, lobbySlotCreatorId: string }
export const createGame = httpsCallable<CreateGameParams, { gameId: string }>(functions, 'createGame')

interface CancelGameParams { gameId: string, reason: string }
export const cancelGame = httpsCallable<CancelGameParams>(functions, 'cancelGame')

interface BanUserParams { userId: string, doNotBackup?: boolean }
export const banUser = httpsCallable<BanUserParams>(functions, 'banUser')

interface UnbanUserParams { userId: string }
export const unbanUser = httpsCallable<UnbanUserParams>(functions, 'unbanUser')

interface DeleteVariantParams { variantId: string }
export const deleteVariant = httpsCallable<DeleteVariantParams>(functions, 'deleteVariant')

interface DiscardUserReportsParams { userId: string, reporters: string[] }
export const discardUserReports = httpsCallable<DiscardUserReportsParams>(functions, 'discardUserReports')

interface DiscardVariantReportsParams { variantId: string, reporters: string[] }
export const discardVariantReports = httpsCallable<DiscardVariantReportsParams>(functions, 'discardVariantReports')

interface WipeUserParams { userId: string }
export const wipeUser = httpsCallable<WipeUserParams>(functions, 'wipeUser')
