
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
  const admin = await useAdmin()
  const db = admin.firestore()
  const userId = user.uid
  
  const userDoc = await db.collection('users').doc(userId).get()
  if (!userDoc.exists) return
  const userData = userDoc.data() as UserDoc
  const username = userData.IMMUTABLE.username
  
  // Remove upvotes
  const userUpvotes = await userDoc.ref.collection('upvotedVariants').get()
  batchedUpdate(db, userUpvotes, (batch, ref) => {
    batch.delete(ref)
  }).catch(err => {
    console.error('Error deleting upvotes for user', userId)
    console.error(err)
  })
  // Delete the user public and private documents
  userDoc.ref.collection('private').doc('doc').delete().catch(err => {
    console.error('Error deleting private user document for user', userId)
    console.error(err)
  })
  userDoc.ref.delete().catch(err => {
    console.error('Error deleting public user document for user', userId)
    console.error(err)
  })
  
  // Free the username
  db.collection('usernames').doc(username).delete().catch(err => {
    console.error('Error deleting username', username, 'for user', userId)
    console.error(err)
  })
  
  // Update the user name in denormalized fields
  updateName(db, userId, '[deleted]', true).catch(err => {
    console.error('Error while updating name for user', userId + ':')
    console.error(err)
  })
  
  // Remove the user's profile picture
  const appDefaultBucket = admin.storage().bucket()
  const profilePicRef = appDefaultBucket.file(`profile-images/${userId}`)
  profilePicRef.delete().catch(err => {
    if (err.code === 404) return
    console.error('Error deleting profile picture for user', userId)
    console.error(err)
  })
}
