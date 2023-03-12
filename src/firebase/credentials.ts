
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_RECHESS_FIREBASE_API_KEY,
  authDomain: 'rechess.org',
  projectId: 'rechess-web',
  storageBucket: 'rechess-web.appspot.com',
  messagingSenderId: '598255262821',
  appId: '1:598255262821:web:6c6dd1a0693096089a7a8c',
  measurementId: 'G-7QWB5DBZ51'
}

const CAPTCHA_V3_PUBLIC_KEY = '6LdlJ94kAAAAACpVuOesHHKRs3ThQR0wFjcgvswr'

export { FIREBASE_CONFIG, CAPTCHA_V3_PUBLIC_KEY }
