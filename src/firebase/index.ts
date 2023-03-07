// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

declare global {
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined
}

if (process.env.NODE_ENV === 'development') {
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBwESJ8ug-V8fxXNg34e9756DymHHDrA08',
  authDomain: 'rechess-web.firebaseapp.com',
  projectId: 'rechess-web',
  storageBucket: 'rechess-web.appspot.com',
  messagingSenderId: '598255262821',
  appId: '1:598255262821:web:6c6dd1a0693096089a7a8c',
  measurementId: 'G-7QWB5DBZ51'
}
const CAPTCHA_PUBLIC_KEY = '6LdlJ94kAAAAACpVuOesHHKRs3ThQR0wFjcgvswr'

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG)
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(CAPTCHA_PUBLIC_KEY),
  isTokenAutoRefreshEnabled: true
})
const db = getFirestore(app)

export { db }
