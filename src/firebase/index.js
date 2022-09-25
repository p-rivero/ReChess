import { initializeApp } from 'firebase/app'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: 'AIzaSyBwESJ8ug-V8fxXNg34e9756DymHHDrA08',
  authDomain: 'rechess-web.firebaseapp.com',
  projectId: 'rechess-web',
  storageBucket: 'rechess-web.appspot.com',
  messagingSenderId: '598255262821',
  appId: '1:598255262821:web:6c6dd1a0693096089a7a8c',
  measurementId: 'G-7QWB5DBZ51'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// TODO: Export the database for components to use