import type { GameDoc, GameSummary, UserDoc } from 'db/schema'
import { useAdmin } from '../helpers'
import { increment } from 'firebase/firestore'

/**
 * Triggered when a game finishes successfully. Updates the denormalized
 * fields in the players' profiles (number of games played, win points and last
 * 5 games).
 * @param {string} gameId The game ID of the game that finished
 * @return {Promise<void>} A promise that resolves when the function completes
 */
export default async function(gameId: string): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
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
  gameRef.update({ 'IMMUTABLE.calledFinishGame': true })
    .catch((e) => console.error('Cannot set calledFinishGame on game', gameId, e))
  
  // Update the profiles
  updateProfile(db, gameId, gameDoc, gameDoc.IMMUTABLE.whiteId)
    .catch((e) => console.error('Cannot update profile', gameDoc.IMMUTABLE.whiteId, e))
  updateProfile(db, gameId, gameDoc, gameDoc.IMMUTABLE.blackId)
    .catch((e) => console.error('Cannot update profile', gameDoc.IMMUTABLE.blackId, e))
}


const WIN_POINTS = {
  win: 1,
  loss: 0,
  draw: 0.5,
} as const

/**
 * Updates the profile of a player after a game has finished.
 * @param {FirebaseFirestore.Firestore} db The Firestore database
 * @param {GameDoc} game The game that finished
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
  const profileRef = db.collection('profiles').doc(playerId)
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
    timeCreated: game.IMMUTABLE.timeCreated,
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
    'IMMUTABLE.numGamesPlayed': increment(1),
    'IMMUTABLE.winPoints': increment(earnedPoints),
    'IMMUTABLE.last5Games': JSON.stringify(last5Games),
  })
}
