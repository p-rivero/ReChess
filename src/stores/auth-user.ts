import { ref } from 'vue'
import { defineStore } from 'pinia'

import { auth, db } from '@/firebase'
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'
import { User } from './user'
import { collection, doc, setDoc } from '@firebase/firestore'


export class AuthUser extends User {
  public email: string
  
  constructor(user: FirebaseUser, username: string) {
    const displayName = user.displayName ?? undefined // null -> undefined
    const photoURL = user.photoURL ?? undefined // null -> undefined
    super(username, displayName, undefined, photoURL)
    
    if (!user.email) throw new Error('User has no email')
    this.email = user.email
  }
}

export const useAuthStore = defineStore('auth-user', () => {
  let initialized = false
  let inhibitLogIn = false
  const user = ref<User|null>(null)
  const verified = ref(false)
  
  // Called when user signs in or out (or when the page is refreshed)
  onAuthStateChanged(auth, async newUser => {
    if (inhibitLogIn) return
    updateUser(newUser)
  })
  async function updateUser(newUser: FirebaseUser|null, username?: string) {
    initialized = true
    if (!newUser || !newUser.email) {
      user.value = null
      return
    }
    verified.value = newUser.emailVerified
    user.value = new AuthUser(newUser, username ?? 'test_username')
  }
  
  async function createUserInDB(user: FirebaseUser, username: string) {
    // Create public user data
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      profileImg: user.photoURL,
      SERVER: {
        username: username,
        numWins: 0,
      }
    })
    // Create private user data
    await setDoc(doc(db, "users", user.uid, "private", "doc"), {
      SERVER: {
        email: user.email,
        banned: false,
      }
    })
  }
  
  
  
  // Attemps to log in with an email and password, returning true if the user exists
  async function emailLogIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password)
  }
  
  async function emailRegister(email: string, username: string, password: string): Promise<void> {
    // Do not store the user until the database is updated
    inhibitLogIn = true
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    try {
      await createUserInDB(credential.user, username)
    } catch (e) {
      // If the database update fails, delete the user
      await credential.user.delete()
      throw e
    }
    // Update the user
    await updateUser(credential.user, username)
    inhibitLogIn = false
  }
  
  async function signOut(): Promise<void> {
    await auth.signOut()
  }
  
  async function isLogged() {
    // Wait for the user to be initialized
    while (!initialized) await new Promise(resolve => setTimeout(resolve, 100))
    return user.value !== null
  }

  return { emailLogIn, emailRegister, signOut, isLogged, user }
})
