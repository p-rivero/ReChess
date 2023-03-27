
import { batchedUpdate, useAdmin } from './helpers'
import { updateName } from './rename-user'
import type { UserDoc } from 'db/schema'
import type { UserRecord } from 'firebase-admin/auth'

/**
 * Called when a user Auth record is deleted. Deletes the user document
 * and cleans up all the denormalized fields.
 * @param {UserRecord} user The user auth record that was deleted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function renameUser(
  user: UserRecord
): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  const userId = user.uid
  
  const userDoc = await db.collection('users').doc(userId).get()
  if (!userDoc.exists) return
  const userData = userDoc.data() as UserDoc
  const username = userData.IMMUTABLE.username
  
  // Remove upvotes
  const userUpvotes = await userDoc.ref.collection('upvotedVariants').get()
  await batchedUpdate(db, userUpvotes, (batch, ref) => {
    batch.delete(ref)
  })
  // Delete the user public and private documents
  await userDoc.ref.collection('private').doc('doc').delete()
  await userDoc.ref.delete()
  
  // Free the username
  await db.collection('usernames').doc(username).delete()
  
  // Update the user name in denormalized fields
  await updateName(db, userId, '[deleted]', true)
}
