import { ref } from 'vue'
import { defineStore } from 'pinia'

import { auth, db } from '@/firebase'
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
type UserCredential,
} from 'firebase/auth'
import { User } from './user'
import { doc, setDoc } from '@firebase/firestore'
import { RechessError } from '@/utils/errors/RechessError'
import { UserNotFoundError } from '@/utils/errors/UserNotFoundError'


export class AuthUser extends User {
  public email: string
  public verified: boolean
  
  constructor(user: FirebaseUser, username: string) {
    const displayName = user.displayName ?? undefined // null -> undefined
    const photoURL = user.photoURL ?? undefined // null -> undefined
    super(username, displayName, undefined, photoURL)
    
    if (!user.email) throw new Error('User has no email')
    this.email = user.email
    this.verified = user.emailVerified
  }
}

export const useAuthStore = defineStore('auth-user', () => {
  let initialized = false
  let inhibitLogIn = false
  const user = ref<AuthUser|null>(null)
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
    // TODO: Get username from database
    user.value = new AuthUser(newUser, username ?? 'test_username')
  }
  
  async function createUserInDB(user: FirebaseUser, username: string) {
    // Create public user data
    // TODO: Batched writes
    try {
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
    } catch (e) {
      throw new RechessError('CANNOT_CREATE_USER')
    }
  }
  
  
  
  // Attemps to log in with an email and password, throws an error if it fails (e.g. wrong password or user does not exist)
  // Updates the stored user if successful
  async function emailLogIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
          throw new UserNotFoundError()
        case 'auth/wrong-password':
          throw new RechessError('WRONG_PASSWORD')
        default:
          throw e
      }
    }
  }
  
  
  // Creates a new user with an email and password, and updates the stored user
  async function emailRegister(email: string, username: string, password: string): Promise<void> {
    // Do not store the user until the database is updated
    inhibitLogIn = true
    
    let credential: UserCredential
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          throw new RechessError('EMAIL_ALREADY_IN_USE')
        default:
          throw e
      }
    }
    
    try {
      await createUserInDB(credential.user, username)
    } catch (e) {
      // If the database update fails, delete the user auth
      await credential.user.delete()
      throw e
    }
    // Update the user
    await updateUser(credential.user, username)
    inhibitLogIn = false
  }
  
  
  // Signs out the user and updates the store
  async function signOut(): Promise<void> {
    await auth.signOut()
  }
  
  // Returns true if the user is logged in, false otherwise
  async function isLogged() {
    // Wait for the user to be initialized
    while (!initialized) await new Promise(resolve => setTimeout(resolve, 100))
    return user.value !== null
  }

  return { emailLogIn, emailRegister, signOut, isLogged, user }
})
