import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../helpers'
import type { GameDoc, GameSummary, UserDoc } from 'db/schema'

/**
 * Triggered when a game finishes successfully. Updates the denormalized
 * fields in the players' profiles (number of games played, win points and last
 * 5 games).
 * Additionally, it updates the game popularity (-1 point).
 * @param {string} gameId The game ID of the game that finished
 * @return {Promise<void>} A promise that resolves when the function completes
 */
export default async function(gameId: string): Promise<void> {
  const { db } = await useAdmin()
  
  // Fetch the game, make sure it exists and is finished
  const gameRef = db.collection('games').doc(gameId)
  const gameSnapshot = await gameRef.get()
  if (!gameSnapshot.exists) {
    console.error('Game does not exist: ' + gameId)
    return
  }
  const gameDoc = gameSnapshot.data() as GameDoc
  if (gameDoc.winner === null) {
    console.error('Game is not finished: ' + gameId)
    return
  }
  
  // Make sure this function is called only once
  if (gameDoc.IMMUTABLE.calledFinishGame) {
    console.warn('finishGame() already called for game: ' + gameId)
    return
  }
  const p1 = gameRef.update({ 'IMMUTABLE.calledFinishGame': true })
    .catch((e) => console.error('Cannot set calledFinishGame on game', gameId, e))
  
  // Update the profiles
  const p2 = updateProfile(db, gameId, gameDoc, gameDoc.IMMUTABLE.whiteId)
    .catch((e) => console.error('Cannot update profile', gameDoc.IMMUTABLE.whiteId, e))
  const p3 = updateProfile(db, gameId, gameDoc, gameDoc.IMMUTABLE.blackId)
    .catch((e) => console.error('Cannot update profile', gameDoc.IMMUTABLE.blackId, e))
    
  // Update the variant popularity
  const variantRef = db.collection('variants').doc(gameDoc.IMMUTABLE.variantId)
  const p4 = variantRef.update({ popularity: FieldValue.increment(-1) })
    .catch((e) => console.error('Cannot update variant popularity', gameDoc.IMMUTABLE.variantId, e))
    
  await Promise.all([p1, p2, p3, p4])
}


const WIN_POINTS = {
  win: 1,
  loss: 0,
  draw: 0.5,
} as const

/**
 * Updates the profile of a player after a game has finished.
 * @param {FirebaseFirestore.Firestore} db The Firestore database
 * @param {string} gameId The UID of the game that finished
 * @param {GameDoc} game The game that finished, corresponding to gameId
 * @param {string} playerId The player ID of the player whose profile should be updated
 * @return {Promise<void>} A promise that resolves when the function completes
 */
async function updateProfile(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  game: GameDoc,
  playerId: string
): Promise<void> {
  // Fetch the profile
  const profileRef = db.collection('users').doc(playerId)
  const profileSnapshot = await profileRef.get()
  if (!profileSnapshot.exists) {
    console.error('Profile does not exist: ' + playerId)
    return
  }
  const profile = profileSnapshot.data() as UserDoc
  
  // Calculate the new values
  const playedSide = game.IMMUTABLE.whiteId === playerId ? 'white' : 'black'
  
  const result =
    game.winner === 'draw' ? 'draw' :
      game.winner === playedSide ? 'win' : 'loss'
  
  const earnedPoints = WIN_POINTS[result]
  
  const [opponentId, opponentName] = playedSide === 'white' ?
    [game.IMMUTABLE.blackId, game.IMMUTABLE.blackDisplayName] :
    [game.IMMUTABLE.whiteId, game.IMMUTABLE.whiteDisplayName]
  
  const newGame: GameSummary = {
    gameId,
    variantId: game.IMMUTABLE.variantId,
    variantName: game.IMMUTABLE.variant.name,
    timeCreatedMs: game.IMMUTABLE.timeCreated.toMillis(),
    playedSide,
    result,
    opponentId,
    opponentName,
  }
  
  // Add the new game to the list of last 5 games
  const last5Games = JSON.parse(profile.IMMUTABLE.last5Games) as GameSummary[]
  const newLen = last5Games.unshift(newGame)
  if (newLen > 5) last5Games.pop()
  
  // Update the profile
  await profileRef.update({
    'IMMUTABLE.numGamesPlayed': FieldValue.increment(1),
    'IMMUTABLE.numWinPoints': FieldValue.increment(earnedPoints),
    'IMMUTABLE.last5Games': JSON.stringify(last5Games),
  })
}
