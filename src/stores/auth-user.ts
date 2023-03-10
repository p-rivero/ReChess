import { ref } from 'vue'
import { defineStore } from 'pinia'

import { auth, db } from '@/firebase'
import * as fb from 'firebase/auth'
import { User } from './user'
import { RechessError } from '@/utils/errors/RechessError'
import { UserNotFoundError } from '@/utils/errors/UserNotFoundError'


export class AuthUser extends User {
  public email: string
  public verified: boolean
  
  constructor(user: fb.User, username: string) {
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
  fb.onAuthStateChanged(auth, async newUser => {
    if (inhibitLogIn) return
    updateUser(newUser)
  })
  async function updateUser(newUser: fb.User|null) {
    initialized = true
    if (!newUser || !newUser.email) {
      user.value = null
      return
    }
    verified.value = newUser.emailVerified
    // The auth token does not include the username, we need to fetch it from the database
    const username = await DB.getUsername(newUser.uid)
    user.value = new AuthUser(newUser, username)
  }  
  
  
  // Attemps to log in with an email and password, throws an error if it fails (e.g. wrong password or user does not exist)
  // Updates the stored user if successful
  async function emailLogIn(email: string, password: string): Promise<void> {
    try {
      await fb.signInWithEmailAndPassword(auth, email, password)
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
    
    let credential: fb.UserCredential
    try {
      credential = await fb.createUserWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          throw new RechessError('EMAIL_ALREADY_IN_USE')
        default:
          throw e
      }
    }
    
    try {
      await DB.createUser(credential.user, username)
    } catch (e) {
      // If the database update fails, delete the user auth
      await credential.user.delete()
      throw e
    }
    // Update the user in the store
    await updateUser(credential.user)
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



// Firestore access

import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { UserDoc, UserPrivateDoc } from '@/firebase/firestore'
namespace DB {
  
  export async function createUser(user: fb.User, username: string) {
    // Create public user data
    // TODO: Batched writes
    const newPublicData: UserDoc = {
      name: user.displayName,
      about: '',
      profileImg: user.photoURL,
      SERVER: {
        username: username,
        numWins: 0,
      }
    }
    if (!user.email) throw new Error('User must have an email')
    const newPrivateData: UserPrivateDoc = {
      SERVER: {
        email: user.email,
        banned: false,
      }
    }
    
    try {
      await setDoc(doc(db, "users", user.uid), newPublicData)
      await setDoc(doc(db, "users", user.uid, "private", "doc"), newPrivateData)
    } catch (e) {
      throw new RechessError('CANNOT_CREATE_USER')
    }
  }
  
  export async function getUsername(uid: string): Promise<string> {
    const document = await getDoc(doc(db, "users", uid))
    // The document should always exist
    const data = document.data()
    if (!data) return '[ERROR]'
    const userDoc = data as UserDoc
    return userDoc.SERVER.username
  }
}
