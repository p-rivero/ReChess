import { defineStore } from 'pinia'
import { ref } from 'vue'

import { RechessError } from '@/helpers/errors/RechessError'
import { User } from '@/stores/user'
import { UserDB } from '@/firebase/db'
import { UserNotFoundError } from '@/helpers/errors/UserNotFoundError'
import { auth } from '@/firebase'

import * as fb from 'firebase/auth'
import { FirebaseError } from '@firebase/util'
import { PopupClosedError } from '@/helpers/errors/PopupClosedError'
import { hideSignInPopup } from '@/helpers/managers/auth-manager'
import type { UserDoc, UserPrivateCacheDoc } from '@/firebase/db/schema'

const AUTH_USER_KEY = 'loggedUser'
const REFRESH_AUTH_PARAM = 'refresh-auth'

export type SignInProvider = 'password' | 'google.com' | 'github.com'

export class AuthUser extends User {
  public readonly email: string
  public readonly verified: boolean
  public readonly moderator: boolean
  public readonly signInProvider: SignInProvider
  public upvotedVariants: string[] = []
  public reportedVariants: string[] = []
  public reportedUsers: string[] = []
  
  constructor(authUser: fb.User, dbUser?: UserDoc, userCache?: UserPrivateCacheDoc, moderator = false) {
    if (!authUser.email) throw new Error('User has no email')
    // If the user has logged in with a third-party provider, the document
    // doesn't exist until they choose a username.
    const DEFAULT_DOC: UserDoc = {
      name: 'New User',
      about: '',
      profileImg: null,
      IMMUTABLE: {
        username: '_', // This cannot be empty (AccountCard RouterLink throws an error)
        renameAllowedAt: null,
        numGamesPlayed: 0,
        numWinPoints: 0,
        last5Games: '[]',
        lastGamesOpponentIds: [],
        lastGamesVariantIds: [],
      },
    }
    super(authUser.uid, dbUser ?? DEFAULT_DOC)
    if (userCache) {
      this.upvotedVariants = userCache.upvotedVariants.split(' ')
      this.reportedVariants = userCache.reportedVariants.split(' ')
      this.reportedUsers = userCache.reportedUsers.split(' ')
    }
    
    this.email = authUser.email
    this.verified = authUser.emailVerified
    this.moderator = moderator
    
    if (authUser.providerData.length === 0) {
      throw new Error('User has no provider data')
    }
    const p = authUser.providerData[0].providerId
    if (p !== 'password' && p !== 'google.com' && p !== 'github.com') {
      throw new Error('Unknown provider: ' + p)
    }
    this.signInProvider = p
  }
}

export const useAuthStore = defineStore('auth-user', () => {
  const loggedUser = ref<AuthUser|null>(getAuthUser())
  
  // Called when user signs in or out (or when the page is refreshed)
  fb.onAuthStateChanged(auth, updateUser)
  async function updateUser(newUser: fb.User | null) {
    if (!newUser?.email) {
      persistUser(null)
      return
    }
    
    // After verifying the email, refresh the auth data to avoid sending unveridied requests
    const url = new URL(window.location.href)
    if (url.searchParams.get(REFRESH_AUTH_PARAM)) {
      // https://stackoverflow.com/questions/47243702/firebase-token-email-verified-going-weird
      await newUser.getIdToken(true)
      url.searchParams.delete(REFRESH_AUTH_PARAM)
      window.location.href = url.toString()
      return
    }
    
    const [user, cache, token] = await Promise.all([
      UserDB.getUserById(newUser.uid),
      UserDB.getUserPrivateCache(newUser.uid),
      newUser.getIdTokenResult(),
    ])
    persistUser(new AuthUser(newUser, user, cache, token.claims.moderator))
    
    // If the user has just verified their email, the popup may already be showing.
    // If needed, hide it.
    if (user && loggedUser.value?.verified) {
      hideSignInPopup()
    }
  }
  
  function persistUser(user: AuthUser|null) {
    loggedUser.value = user
    if (!user) localStorage.removeItem(AUTH_USER_KEY)
    else localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
  function getAuthUser(): AuthUser|null {
    const user = localStorage.getItem(AUTH_USER_KEY)
    if (!user) return null
    return JSON.parse(user)
  }
  
  
  // Attemps to log in with an email and password, throws an error if it fails (e.g. wrong password or user does not exist)
  // Updates the stored user if successful
  async function emailLogIn(email: string, password: string): Promise<void> {
    try {
      const credential = await fb.signInWithEmailAndPassword(auth, email, password)
      await updateUser(credential.user)
    } catch (e) {
      if (!(e instanceof FirebaseError)) throw e
      switch (e.code) {
      case 'auth/user-not-found':
        throw new UserNotFoundError()
      case 'auth/wrong-password':
        throw new RechessError('WRONG_PASSWORD')
      case 'auth/user-disabled':
          throw new RechessError('USER_DISABLED')
      default:
        console.error('Unknown error while logging in with email and password', e)
        throw e
      }
    }
  }
  
  
  // Creates a new user with an email and password, and updates the stored user
  async function emailRegister(email: string, username: string, password: string): Promise<void> {
    let credential: fb.UserCredential
    try {
      credential = await fb.createUserWithEmailAndPassword(auth, email, password)
    } catch (e) {
      if (!(e instanceof FirebaseError)) throw e
      switch (e.code) {
      case 'auth/email-already-in-use':
        throw new RechessError('EMAIL_ALREADY_IN_USE')
      default:
        throw e
      }
    }
    
    try {
      await UserDB.createUser(credential.user, username)
    } catch (e) {
      // If the database update fails, delete the user auth
      await credential.user.delete()
      await updateUser(null)
      console.error('Failed to create user in database', e)
      throw new RechessError('CANNOT_CREATE_USER')
    }
    
    await updateUser(credential.user)
  }
  
  
  async function thirdPartySignIn(signInprovider: 'google'|'github'): Promise<UserDoc | undefined> {
    let provider: fb.GoogleAuthProvider | fb.GithubAuthProvider
    
    if (signInprovider === 'google') {
      provider = new fb.GoogleAuthProvider()
    } else {
      provider = new fb.GithubAuthProvider()
    }
    
    provider.addScope('profile')
    provider.addScope('https://www.googleapis.com/auth/userinfo.email')
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile')
    auth.useDeviceLanguage()
    
    try {
      const credential = await fb.signInWithPopup(auth, provider)
      await updateUser(credential.user)
      return UserDB.getUserById(credential.user.uid)
    } catch (e) {
      if (!(e instanceof FirebaseError)) {
        throw e
      }
      switch (e.code) {
      case 'auth/popup-closed-by-user':
        throw new PopupClosedError()
      case 'auth/account-exists-with-different-credential':
        throw new RechessError('WRONG_PASSWORD_PROVIDER', { provider: signInprovider === 'google' ? 'GitHub' : 'Google' })
      case 'auth/user-disabled':
        throw new RechessError('USER_DISABLED')
      default:
        throw e
      }
    }
  }
  
  // Creates a new user that is already authenticated with a third party provider
  async function thirdPartyRegister(username: string): Promise<void> {
    if (!auth.currentUser) throw new Error('User needs to be logged in with a third party provider')
    try {
      const userDoc = await UserDB.createUser(auth.currentUser, username)
      persistUser(new AuthUser(auth.currentUser, userDoc))
    } catch (e) {
      console.error('Failed to create user in database', e)
      throw new RechessError('CANNOT_CREATE_USER')
    }
    // If this provider is not trusted, send an email verification
    if (!auth.currentUser.emailVerified) {
      await sendEmailVerification()
    }
  }
  
  
  // Signs out the user and updates the store
  async function signOut(): Promise<void> {
    await auth.signOut()
  }
  
  // Removes the user auth. This triggers a cloud function that deletes the user documents.
  async function deleteUser(): Promise<void> {
    if (!auth.currentUser) throw new Error('User is not logged in')
    await auth.currentUser.delete()
  }
  
  async function sendEmailVerification() {
    if (!auth.currentUser) throw new Error('User is not logged in')
    const url = new URL(window.location.origin)
    url.searchParams.set(REFRESH_AUTH_PARAM, 'true')
    await fb.sendEmailVerification(auth.currentUser, {
      url: url.toString(),
      handleCodeInApp: true,
    })
  }
  
  async function sendPasswordResetEmail(address: string) {
    await fb.sendPasswordResetEmail(auth, address, {
      url: window.location.origin,
      handleCodeInApp: true,
    })
  }
  
  async function getProvider(email: string): Promise<SignInProvider> {
    const methods = await fb.fetchSignInMethodsForEmail(auth, email)
    if (methods.length === 0) throw new UserNotFoundError()
    if (methods.length > 1) throw new Error('User has multiple sign in methods')
    return methods[0] as SignInProvider
  }
  
  // Returns true if the username has not been taken yet
  async function usernameAvailable(username: string): Promise<boolean> {
    return (await UserDB.getUserByUsername(username)) === undefined
  }

  return {
    emailLogIn, emailRegister, thirdPartySignIn, thirdPartyRegister, signOut, deleteUser,
    sendEmailVerification, sendPasswordResetEmail, getProvider, usernameAvailable,
    loggedUser,
  }
})



