
import { batchedUpdate, useAdmin } from '../helpers'
import { updateName } from './rename-user'
import type { UserDoc } from 'db/schema'
import type { UserRecord } from 'firebase-admin/auth'

/**
 * Called when a user Auth record is deleted. Deletes the user document
 * and cleans up all the denormalized fields.
 * @param {UserRecord} user The user auth record that was deleted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(user: UserRecord): Promise<void> {
  const { db, storage } = await useAdmin()
  const userId = user.uid
  
  const userDoc = await db.collection('users').doc(userId).get()
  if (!userDoc.exists) return
  const userData = userDoc.data() as UserDoc
  const username = userData.IMMUTABLE.username
  
  // Remove upvotes
  const userUpvotes = await userDoc.ref.collection('upvotedVariants').get()
  const p1 = batchedUpdate(db, userUpvotes, (batch, ref) => {
    batch.delete(ref)
  }).catch((err) => {
    console.error('Error deleting upvotes for user', userId)
    console.error(err)
  })
  // Delete the user public and private documents
  const p2 = userDoc.ref.collection('private').doc('doc').delete().catch((err) => {
    console.error('Error deleting private user document for user', userId)
    console.error(err)
  })
  const p3 = userDoc.ref.collection('privateCache').doc('doc').delete().catch((err) => {
    console.error('Error deleting cache document for user', userId)
    console.error(err)
  })
  const p4 = userDoc.ref.collection('renameTrigger').doc('doc').delete().catch((err) => {
    console.error('Error deleting renameTrigger document for user', userId)
    console.error(err)
  })
  const p5 = userDoc.ref.delete().catch((err) => {
    console.error('Error deleting public user document for user', userId)
    console.error(err)
  })
  
  // Free the username
  const p6 = db.collection('usernames').doc(username).delete().catch((err) => {
    console.error('Error deleting username', username, 'for user', userId)
    console.error(err)
  })
  
  // Update the user name in denormalized fields
  const p7 = updateName(db, userId, '[deleted]', true).catch((err) => {
    console.error('Error while updating name for user', userId + ':')
    console.error(err)
  })
  
  // Remove the user's profile picture
  const appDefaultBucket = storage.bucket()
  const profilePicRef = appDefaultBucket.file(`profile-images/${userId}`)
  const p8 = profilePicRef.delete().catch((err) => {
    if (err.code === 404) return
    console.error('Error deleting profile picture for user', userId)
    console.error(err)
  })
  
  // Remove the moderation document
  const p9 = db.collection('userModeration').doc(userId).delete().catch((err) => {
    console.error('Error deleting moderation document for user', userId)
    console.error(err)
  })
  
  await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9])
}
