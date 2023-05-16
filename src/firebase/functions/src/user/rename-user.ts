
import { Timestamp } from 'firebase-admin/firestore'
import type { Change } from 'firebase-functions'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

import { batchedUpdate, useAdmin } from '../helpers'
import type { UserRenameTriggerDoc } from 'db/schema'


/**
 * Called when the user changes their name in the user document.
 * Updates the name also in the denormalized fields.
 * @param {Change<QueryDocumentSnapshot>} change Snapshots of the `renameTrigger` document before and after the change
 * @param {string} userId The UID of the user that changed
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(
  change: Change<QueryDocumentSnapshot>,
  userId: string
): Promise<void> {
  const TIMEOUT_SECONDS = 5 * 60 // 5 minutes
  
  const doc = change.after.data() as UserRenameTriggerDoc
  
  // The name has changed, initialize the admin SDK
  const admin = await useAdmin()
  const db = admin.firestore()
  
  // If this write was allowed by the rules, the current timestamp must be after the renameAllowedAt
  const newName = doc.name || `@${doc.username}`
  await updateName(db, userId, newName, false)
  
  // Update the timeout to prevent spamming
  const timeout = Date.now() + 1000 * TIMEOUT_SECONDS
  const timeoutDate = new Date(timeout)
  const timeoutTimestamp = Timestamp.fromDate(timeoutDate)
  try {
    await db.collection('users').doc(userId).update({ 'IMMUTABLE.renameAllowedAt': timeoutTimestamp })
  } catch (err) {
    console.error('Error while updating rename timeout for user', userId + ':')
    console.error(err)
  }
}


/**
 * Update the name of a user in all the denormalized fields across the database
 * (except for the user document itself)
 * @param {FirebaseFirestore.Firestore} db The Firestore database
 * @param {string} userId The UID of the user to update
 * @param {string} newName The new name of the user
 * @param {boolean} removeId If true, the user ID will be removed from the denormalized fields
 * to indicate that the user no longer exists
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function updateName(
  db: FirebaseFirestore.Firestore,
  userId: string,
  newName: string,
  removeId: boolean
): Promise<void> {
  // Update the creator name of the variants this user has created
  const updatedVariants = await db.collection('variants').where('creatorId', '==', userId).get()
  const p1 = batchedUpdate(db, updatedVariants, (batch, ref) => {
    batch.update(ref, {
      'creatorDisplayName': newName,
      'creatorId': removeId ? null : userId,
    })
  }).catch((err) => {
    console.error('Error while updating variants for user', userId + ':')
    console.error(err)
  })
  
  // Update the opponent name of the games this user has played as white
  const updatedGamesWhite = await db.collection('games').where('IMMUTABLE.whiteId', '==', userId).get()
  const p2 = batchedUpdate(db, updatedGamesWhite, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.whiteDisplayName': newName,
      'IMMUTABLE.whiteId': removeId ? null : userId,
    })
  }).catch((err) => {
    console.error('Error while updating games (white) for user', userId + ':')
    console.error(err)
  })
  
  // Update the opponent name of the games this user has played as black
  const updatedGamesBlack = await db.collection('games').where('IMMUTABLE.blackId', '==', userId).get()
  const p3 = batchedUpdate(db, updatedGamesBlack, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.blackDisplayName': newName,
      'IMMUTABLE.blackId': removeId ? null : userId,
    })
  }).catch((err) => {
    console.error('Error while updating games (black) for user', userId + ':')
    console.error(err)
  })
  // Do not update the name in the lobby entries, because they are short-lived and
  // it's not a problem to have the old name there for a while
  
  await Promise.all([p1, p2, p3])
}
