import { FIREBASE_CONFIG, CAPTCHA_V3_PUBLIC_KEY } from './credentials'

// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from "firebase/storage"
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, connectAuthEmulator, browserLocalPersistence } from "firebase/auth";
import * as firebaseui from 'firebaseui'

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined
}

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG)
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

auth.setPersistence(browserLocalPersistence)

// In development, use the emulator
if (import.meta.env.DEV) {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}

enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence could not be enabled because another tab is already open')
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does NOT support firestore persistence.')
  }
})

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(CAPTCHA_V3_PUBLIC_KEY),
  isTokenAutoRefreshEnabled: true
})


const authUI = new firebaseui.auth.AuthUI(auth)

export { db, storage, auth, authUI }
