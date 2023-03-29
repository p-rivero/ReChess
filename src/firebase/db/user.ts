import { db } from '@/firebase'
import type { UserDoc, UsernameDoc, UserPrivateDoc } from '@/firebase/db/schema'

import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import type { User } from '@firebase/auth'

// Creates a new user in the database (public data + private data + username)
export async function createUser(user: User, username: string): Promise<UserDoc> {
  const batch = writeBatch(db)
  const newPublicData: UserDoc = {
    name: user.displayName,
    about: '',
    profileImg: user.photoURL,
    IMMUTABLE: {
      username: username,
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  if (!user.email) throw new Error('User must have an email')
  const newPrivateData: UserPrivateDoc = {
    IMMUTABLE: {
      email: user.email,
      banned: false,
    },
  }
  const newUsername: UsernameDoc = {
    userId: user.uid,
  }
  batch.set(doc(db, 'users', user.uid), newPublicData)
  batch.set(doc(db, 'users', user.uid, 'private', 'doc'), newPrivateData)
  batch.set(doc(db, 'usernames', username), newUsername)
  
  await batch.commit()
  
  return newPublicData
}

// username -> userId
export async function getId(username: string): Promise<string | undefined> {
  const document = await getDoc(doc(db, 'usernames', username))
  if (!document.exists()) return undefined
  const data = document.data() as UsernameDoc
  return data.userId
}

// userId -> UserDoc
export async function getUserById(uid: string): Promise<UserDoc | undefined> {
  const document = await getDoc(doc(db, 'users', uid))
  if (!document.exists()) return undefined
  return document.data() as UserDoc
}

// Store a user in the database
export async function updateUser(uid: string, user: UserDoc): Promise<void> {
  const editableFields = {
    name: user.name,
    about: user.about,
    profileImg: user.profileImg,
  }
  await updateDoc(doc(db, 'users', uid), editableFields)
}
