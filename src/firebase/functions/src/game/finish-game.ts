import { FieldValue } from 'firebase-admin/firestore'
import { fetchGameDoc } from './helpers/fetch-game'
import { fetchUserDoc } from '../user/helpers/fetch-user'
import { updateVariantPopularity } from '../variant/helpers/update-variant-metrics'
import { useAdmin } from '../helpers'
import type { GameDoc, GameSummary, UserDoc } from 'db/schema'
import { createGameSummary, extractIds } from './helpers/game-summary'

/**
 * Triggered when a game finishes successfully. Updates the denormalized
 * fields in the players' profiles (number of games played, win points and last
 * 5 games).
 * Additionally, it updates the game popularity (-1 point).
 * @param {string} gameId The game ID of the game that finished
 * @return {Promise<void>} A promise that resolves when the function completes
 */
export default async function(gameId: string): Promise<void> {
  const gameDoc = await fetchGameDoc(gameId)
  if (!gameDoc) {
    console.error('Game does not exist: ' + gameId)
    return
  }
  if (gameDoc.winner === null) {
    console.error('Game is not finished: ' + gameId)
    return
  }
  
  // Make sure this function is called only once
  if (gameDoc.IMMUTABLE.calledFinishGame) {
    console.warn('finishGame() already called for game: ' + gameId)
    return
  }
  
  await Promise.all([
    setFinishGameFlag(gameId),
    updateProfile([gameId, gameDoc], gameDoc.IMMUTABLE.whiteId),
    updateProfile([gameId, gameDoc], gameDoc.IMMUTABLE.blackId),
    updateVariantPopularity(gameDoc.IMMUTABLE.variantId, -1),
  ])
}

async function setFinishGameFlag(gameId: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('games').doc(gameId).update({
      'IMMUTABLE.calledFinishGame': true,
    })
  } catch (e) {
    console.error('Cannot set calledFinishGame on game', gameId, e)
  }
}


const WIN_POINTS = {
  win: 1,
  loss: 0,
  draw: 0.5,
} as const

async function updateProfile(game: [string, GameDoc], userId: string): Promise<void> {
  const userDoc = await fetchUserDoc(userId)
  if (!userDoc) {
    console.error('Profile does not exist: ' + userId)
    return
  }
  const newGame = createGameSummary(game, userId)
  await appendGameSummary([userId, userDoc], newGame)
}

async function appendGameSummary(user: [string, UserDoc], newGame: GameSummary) {
  const MAX_CACHED_GAMES = 5
  const { db } = await useAdmin()
  const [userId, userDoc] = user
  
  const last5Games = JSON.parse(userDoc.IMMUTABLE.last5Games) as GameSummary[]
  const lengthAfterAddingGame = last5Games.unshift(newGame)
  if (lengthAfterAddingGame > MAX_CACHED_GAMES) {
    last5Games.pop()
  }
  const { opponentIds, variantIds } = extractIds(last5Games)
  
  // It would be safer to use a transaction here to read and update the profile, but
  // it would make the code less readable and it's not a big deal, since the same user
  // is unlikely to finish 2 games at the same time.
  try {
    const earnedPoints = WIN_POINTS[newGame.result]
    await db.collection('users').doc(userId).update({
      'IMMUTABLE.numGamesPlayed': FieldValue.increment(1),
      'IMMUTABLE.numWinPoints': FieldValue.increment(earnedPoints),
      'IMMUTABLE.last5Games': JSON.stringify(last5Games),
      'IMMUTABLE.lastGamesOpponentIds': opponentIds,
      'IMMUTABLE.lastGamesVariantIds': variantIds,
    })
  } catch (e) {
    console.error('Cannot update profile', userId, e)
  }
}
