
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../helpers'
import assertAuth from '../assert-auth'
import type { CancelledGameDoc, GameDoc } from 'db/schema'
import type { Timestamp } from 'firebase/firestore'

/**
 * Called directly by the client when it detects that the opponent has made an
 * illegal move. This function will cancel the game immediately.
 * The cancelled game will be moved to the `cancelledGames` collection for
 * the moderators to review.
 * Additionally, it updates the game popularity (-1 point).
 * @param {any} data The data passed to the function
 * @param {string} data.gameId The game to cancel
 * @param {string} data.reason The user-provided reason why the game was cancelled
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function completes
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  const auth = assertAuth(context)
  
  // Validate input
  const { gameId, reason } = data as { gameId: unknown, reason: unknown }
  if (!gameId || !reason) {
    throw new HttpsError('invalid-argument', 'The function must be called with a gameId and reason.')
  }
  if (typeof gameId !== 'string') {
    throw new HttpsError('invalid-argument', 'The gameId must be a string.')
  }
  if (typeof reason !== 'string') {
    throw new HttpsError('invalid-argument', 'The reason must be a string.')
  }
  if (reason.length > 500) {
    throw new HttpsError('invalid-argument', 'The reason must be at most 500 characters.')
  }
  
  const { db } = await useAdmin()
  
  // Fetch the game
  const gameRef = db.collection('games').doc(gameId)
  const gameSnapshot = await gameRef.get()
  if (!gameSnapshot.exists) {
    throw new HttpsError('not-found', 'The game does not exist.')
  }
  const gameDoc = gameSnapshot.data() as GameDoc
  
  // Check that the caller is a player in the game
  if (auth.uid !== gameDoc.IMMUTABLE.whiteId && auth.uid !== gameDoc.IMMUTABLE.blackId) {
    throw new HttpsError('permission-denied', 'The function must be called by either the white or black player.')
  }
  
  // Add the game to the cancelledGames collection
  const cancelledGameDoc: CancelledGameDoc = {
    ...gameDoc,
    cancelledByUserId: auth.uid,
    cancelReason: reason,
    cancelTime: FieldValue.serverTimestamp() as Timestamp,
  }
  const cancelledGameRef = db.collection('cancelledGames').doc(gameId)
  await cancelledGameRef.set(cancelledGameDoc)
    .catch((e) => console.error('Cannot add cancelled game', gameId, e, cancelledGameDoc))
  
  // Delete the game from the games collection
  await gameRef.delete()
    .catch((e) => console.error('Cannot delete game', gameId, e))
  
  // Update the variant popularity
  const variantRef = db.collection('variants').doc(gameDoc.IMMUTABLE.variantId)
  await variantRef.update({ popularity: FieldValue.increment(-1) })
    .catch((e) => console.error('Cannot update variant popularity', gameDoc.IMMUTABLE.variantId, e))
}
