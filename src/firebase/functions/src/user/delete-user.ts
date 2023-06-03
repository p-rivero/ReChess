
import { batchedUpdate, useAdmin } from '../helpers'
import { updateName } from './rename-user'
import { discardReports as discardReportsFn } from '../moderator/helpers/discard-reports'
import type { UserDoc, UserPrivateCacheDoc } from 'db/schema'
import type { UserRecord } from 'firebase-admin/auth'
import type { DocumentReference } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v1/https'
import { stopOngoingGames } from '../game/helpers/stop-ongoing-games'

/**
 * Called when a user Auth record is deleted. Deletes the user document
 * and cleans up all the denormalized fields.
 * @param {UserRecord} user The user auth record that was deleted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(user: UserRecord): Promise<void> {
  const { db } = await useAdmin()
  const userId = user.uid
  
  const userRef = db.collection('users').doc(userId)
  const [username, cache] = await Promise.all([
    getUsername(userRef),
    getCache(userRef),
  ])
  if (!username) {
    console.error('User document for user', userId, 'does not exist')
    return
  }
  
  await stopOngoingGames(userId)
  
  await Promise.all([
    deleteUserSubcollections(userRef),
    deleteUserDocument(userRef),
    freeUsername(username),
    removeNameFromDenormalizedFields(userId),
    deleteProfilePicture(userId),
    deleteModerationDocument(userId),
    discardAllReports(username, cache),
  ])
}

async function getUsername(userRef: DocumentReference): Promise<string | undefined> {
  const userSnapshot = await userRef.get()
  const userData = userSnapshot.data() as UserDoc | undefined
  if (!userData) return undefined
  return userData.IMMUTABLE.username
}
async function getCache(userRef: DocumentReference): Promise<UserPrivateCacheDoc | undefined> {
  const cacheSnapshot = await userRef.collection('privateCache').doc('doc').get()
  return cacheSnapshot.data() as UserPrivateCacheDoc | undefined
}

async function deleteUserSubcollections(userRef: DocumentReference) {
  const collections = await userRef.listCollections()
  try {
    await Promise.all(collections.map(async (collection) => {
      const docs = await collection.listDocuments()
      await batchedUpdate(docs, (batch, ref) => {
        batch.delete(ref)
      })
    }))
  } catch (err) {
    console.error('Error deleting subcollections of user document for user', userRef.id)
    console.error(err)
  }
}

async function deleteUserDocument(userRef: DocumentReference) {
  try {
    await userRef.delete()
  } catch (err) {
    console.error('Error deleting public user document for user', userRef.id)
    console.error(err)
  }
}

async function freeUsername(username: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('usernames').doc(username).delete()
  } catch (err) {
    console.error('Error deleting username', username)
    console.error(err)
  }
}

async function removeNameFromDenormalizedFields(userId: string) {
  try {
    await updateName(userId, null)
  } catch (err) {
    console.error('Error while updating name for user', userId + ':')
    console.error(err)
  }
}

async function deleteProfilePicture(userId: string) {
  const { storage } = await useAdmin()
  const appDefaultBucket = storage.bucket()
  const profileImgRef = appDefaultBucket.file(`profile-images/${userId}`)
  try {
    await profileImgRef.delete()
  } catch (err) {
    // Allow 404 errors (user doesn't have a profile picture)
    if (typeof err !== 'object' || !err) throw err
    const typedErr = err as { code: number }
    if (typedErr.code === 404) return
    console.error('Error deleting profile picture for user', userId)
    console.error(err)
  }
}

async function deleteModerationDocument(userId: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('userModeration').doc(userId).delete()
  } catch (err) {
    console.error('Error deleting moderation document for user', userId)
    console.error(err)
  }
}

async function discardAllReports(reporterUsername: string, cache: UserPrivateCacheDoc | undefined) {
  // If user has not reported anything, cache can be undefined
  if (!cache) return
  const reportedUsers = cache.reportedUsers.split(' ').filter(r => r.length > 0)
  const reportedVariants = cache.reportedVariants.split(' ').filter(r => r.length > 0)
  
  await Promise.all([
    discardReports('user', reportedUsers, reporterUsername),
    discardReports('variant', reportedVariants, reporterUsername),
  ])
  
  async function discardReports(type: 'user'|'variant', ids: string[], reporterUsername: string) {
    const { db } = await useAdmin()
    const moderationCollection = type === 'user' ? 'userModeration' : 'variantModeration'
    
    await Promise.all(ids.map(async (id) => {
      const moderationDocRef = db.collection(moderationCollection).doc(id)
      try {
        await discardReportsFn([reporterUsername], moderationDocRef)
      } catch (err) {
        // Allow 404 errors. This entry can be a block instead of a report. Also, 
        // the report may have been deleted by a moderator.
        if (err instanceof HttpsError && err.code === 'not-found') return
        console.error(`Cannot remove the report of ${type} ${id} by @${reporterUsername}`)
        console.error(err)
      }
    }))
  }
}
