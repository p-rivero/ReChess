
import { HttpsError } from 'firebase-functions/v1/https'
import { batchedUpdate, useAdmin } from '../helpers'
import { discardReports as discardReportsFn } from '../moderator/helpers/discard-reports'
import { fetchUserCache, fetchUserDoc } from './helpers/fetch-user'
import { stopOngoingGames } from '../game/helpers/stop-ongoing-games'
import { updateName } from './rename-user'
import type { UserPrivateCacheDoc } from 'db/schema'
import type { UserRecord } from 'firebase-admin/auth'

/**
 * Called when a user Auth record is deleted. Deletes the user document
 * and cleans up all the denormalized fields.
 * @param {UserRecord} user The user auth record that was deleted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(user: UserRecord): Promise<void> {
  const userId = user.uid
  const [userDoc, userCache] = await Promise.all([
    fetchUserDoc(userId),
    fetchUserCache(userId),
  ])
  if (!userDoc) {
    console.error('User document for user', userId, 'does not exist')
    return
  }
  const username = userDoc.IMMUTABLE.username
  
  await stopOngoingGames(userId)
  
  await Promise.all([
    deleteUserDocument(userId),
    deleteUserSubcollections(userId),
    freeUsername(username),
    removeNameFromDenormalizedFields(userId),
    deleteProfilePicture(userId),
    deleteModerationDocument(userId),
    discardAllReports(username, userCache),
  ])
}


async function deleteUserDocument(userId: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('users').doc(userId).delete()
  } catch (err) {
    console.error('Error deleting public user document for user', userId)
    console.error(err)
  }
}
async function deleteUserSubcollections(userId: string) {
  const { db } = await useAdmin()
  const collections = await db.collection('users').doc(userId).listCollections()
  try {
    await Promise.all(collections.map(async (collection) => {
      const docs = await collection.listDocuments()
      await batchedUpdate(docs, (batch, ref) => {
        batch.delete(ref)
      })
    }))
  } catch (err) {
    console.error('Error deleting subcollections of user document for user', userId)
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
  const reportedUsers = cache.reportedUsers.split(' ').filter((r) => r.length > 0)
  const reportedVariants = cache.reportedVariants.split(' ').filter((r) => r.length > 0)
  
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
