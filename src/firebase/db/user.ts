import { db } from '@/firebase'
import type { ReportDoc, UserDoc, UserPrivateCacheDoc, UserPrivateDoc, UsernameDoc } from '@/firebase/db/schema'

import { Timestamp, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import type { User } from '@firebase/auth'

// Creates a new user in the database (public data + private data + username)
export async function createUser(user: User, username: string): Promise<UserDoc> {
  const newPublicData: UserDoc = {
    name: user.displayName,
    about: '',
    profileImg: user.photoURL,
    IMMUTABLE: {
      username: username,
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  if (!user.email) throw new Error('User must have an email')
  const newPrivateData: UserPrivateDoc = {
    IMMUTABLE: {
      email: user.email,
    },
  }
  const newUsername: UsernameDoc = {
    userId: user.uid,
  }
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', user.uid), newPublicData)
  batch.set(doc(db, 'users', user.uid, 'private', 'doc'), newPrivateData)
  batch.set(doc(db, 'users', user.uid, 'renameTrigger', 'doc'), { name: user.displayName, username })
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
// userId -> UserPrivateCacheDoc
export async function getUserPrivateCache(uid: string): Promise<UserPrivateCacheDoc | undefined> {
  const document = await getDoc(doc(db, 'users', uid, 'privateCache', 'doc'))
  if (!document.exists()) return undefined
  return document.data() as UserPrivateCacheDoc
}

// Update a user's public data
export async function updateUser(uid: string, name: string|null, about: string, profileImg: string|null, updateName: boolean): Promise<void> {
  const editableFields = { name, about, profileImg }
  if (updateName) {
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', uid), editableFields)
    batch.update(doc(db, 'users', uid, 'renameTrigger', 'doc'), { name })
    await batch.commit()
  } else {
    await updateDoc(doc(db, 'users', uid), editableFields)
  }
}

// Reports a user
export async function reportUser(reporterId: string, reportedUserId: string, onlyBlock: boolean, reason: string): Promise<void> {
  const reportDoc: ReportDoc = {
    time: serverTimestamp() as Timestamp,
    reason: reason,
    onlyBlock,
  }
  await setDoc(doc(db, 'users', reporterId, 'reportedUsers', reportedUserId), reportDoc)
}
