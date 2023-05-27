
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../helpers'
import assertAuth from '../assert-auth'
import type { GameDoc, LobbySlotDoc, VariantDoc } from 'db/schema'
import type { Timestamp } from 'firebase/firestore'

/**
 * Called directly by the client in order to create a new game.
 * Additionally, it updates the game popularity (+1 point).
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that the user wishes to play
 * @param {string} data.lobbySlotCreatorId UID of the user that created the lobby slot.
 *  There MUST be a lobby slot for this user and variant.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<{gameId: string}>} The UID of the newly created game
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as the creator of the lobby slot (i.e. `lobbySlotCreatorId !== auth.uid`)
 * - There is no lobby slot for the given variant and creator
 * - The lobby slot has no challenger
 */
export default async function(data: unknown, context: CallableContext): Promise<{gameId: string}> {
  const auth = assertAuth(context)
  
  // Validate input
  const { variantId, lobbySlotCreatorId } = data as { variantId: unknown, lobbySlotCreatorId: unknown }
  if (!variantId || !lobbySlotCreatorId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId and lobbySlotCreatorId.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  if (typeof lobbySlotCreatorId !== 'string') {
    throw new HttpsError('invalid-argument', 'The lobbySlotCreatorId must be a string.')
  }
  if (auth.uid !== lobbySlotCreatorId) {
    throw new HttpsError('permission-denied', 'The function must be called by the user that created the lobby slot.')
  }
  
  const { db } = await useAdmin()
  
  // Fetch the lobby slot
  const lobbySlotRef = db.collection('variants').doc(variantId).collection('lobby').doc(lobbySlotCreatorId)
  const lobbySlotSnapshot = await lobbySlotRef.get()
  if (!lobbySlotSnapshot.exists) {
    throw new HttpsError('failed-precondition', 'The lobby slot does not exist: ' + lobbySlotRef.path)
  }
  
  // Check that the lobby slot has a challenger and no game ID
  const slotDoc = lobbySlotSnapshot.data() as LobbySlotDoc
  if (!slotDoc.challengerId || !slotDoc.challengerDisplayName) {
    throw new HttpsError('failed-precondition', 'The lobby slot has no challenger.')
  }
  if (slotDoc.IMMUTABLE.gameDocId) {
    throw new HttpsError('failed-precondition', 'The lobby slot already has a game.')
  }
  
  // Fetch the variant document
  const variantRef = db.collection('variants').doc(variantId)
  const variantSnapshot = await variantRef.get()
  if (!variantSnapshot.exists) {
    throw new HttpsError('not-found', 'The variant does not exist.')
  }
  const variantDoc = variantSnapshot.data() as VariantDoc
  
  // Update variant popularity
  const p1 = variantRef.update({ popularity: FieldValue.increment(1) })
    .catch((e) => console.error('Cannot update variant popularity', variantId, e))
  
  // Convert the playerToMove field from 0|1 to 'white'|'black'
  const variantInitialState = JSON.parse(variantDoc.initialState)
  if (variantInitialState.playerToMove !== 0 && variantInitialState.playerToMove !== 1) {
    throw new HttpsError('internal', 'The variant has an invalid initial state.')
  }
  const playerToMove = variantInitialState.playerToMove === 0 ? 'white' : 'black'
  
  
  // Determine which player is white and which is black
  // The game document is created here and not in the client because only server-side
  // code can be trusted to assign a random side to each player
  
  // Here it's safe to use Math.random instead of crypto because this is not a cryptographic
  // operation, we just want users to be assigned each side approximately half the time
  const creatorPlaysAsWhite =
    slotDoc.IMMUTABLE.requestedColor === 'white' ||
    (slotDoc.IMMUTABLE.requestedColor === 'random' && Math.random() < 0.5)
    
  const [whiteId, whiteDisplayName] = creatorPlaysAsWhite ?
    [lobbySlotCreatorId, slotDoc.IMMUTABLE.creatorDisplayName] :
    [slotDoc.challengerId, slotDoc.challengerDisplayName]
    
  const [blackId, blackDisplayName] = creatorPlaysAsWhite ?
    [slotDoc.challengerId, slotDoc.challengerDisplayName] :
    [lobbySlotCreatorId, slotDoc.IMMUTABLE.creatorDisplayName]
  
    
  // Add a new game document to the games collection
  const newGame: GameDoc = {
    moveHistory: '',
    playerToMove,
    winner: null,
    IMMUTABLE: {
      timeCreated: FieldValue.serverTimestamp() as Timestamp,
      variantId,
      variant: variantDoc,
      whiteId,
      whiteDisplayName,
      blackId,
      blackDisplayName,
      requestedColor: slotDoc.IMMUTABLE.requestedColor,
      players: [whiteId, blackId],
      calledFinishGame: false,
    },
  }
  const gameRef = await db.collection('games').add(newGame)
  const gameId = gameRef.id
  
  // Update the lobby slot
  const p2 = lobbySlotRef.update({
    'IMMUTABLE.gameDocId': gameId,
  }).catch((e) => console.error('Cannot update lobby slot', lobbySlotRef.path, e))
  
  await Promise.all([p1, p2])
  return { gameId }
}
