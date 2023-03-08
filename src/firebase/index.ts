import { FIREBASE_CONFIG, CAPTCHA_V3_PUBLIC_KEY } from './credentials'

// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from "firebase/storage"
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined
}

if (import.meta.env.DEV) {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG)
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(CAPTCHA_V3_PUBLIC_KEY),
  isTokenAutoRefreshEnabled: true
})
const db = getFirestore(app)

const storage = getStorage(app)

export { db, storage }
