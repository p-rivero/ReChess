import { GameDoc, GameSummary } from 'db/schema'
import { useAdmin } from '../../helpers'
import { createGameSummary, extractIds } from '../../game/helpers/game-summary'

/**
 * Refreshes the cache of a user's last 5 games.
 * @param {string} userId The user ID of the user whose last games to refresh
 */
export async function refreshUserLastGames(userId: string) {
  const CACHED_GAMES = 5
  const games = await getLastFinishedGames(userId, CACHED_GAMES)
  const gamesSummary = games.map(game => createGameSummary(game, userId))
  await updateGameCache(userId, gamesSummary)
}

async function getLastFinishedGames(userId: string, numGames: number): Promise<[string, GameDoc][]> {
  const { db } = await useAdmin()
  const snapshot = await db.collection('games')
    .where('IMMUTABLE.players', 'array-contains', userId)
    .where('playerToMove', '==', 'game-over')
    .orderBy('IMMUTABLE.timeCreated', 'desc')
    .limit(numGames)
    .get()
  
  return snapshot.docs.map(doc => [doc.id, doc.data() as GameDoc])
}

async function updateGameCache(userId: string, gamesSummary: GameSummary[]) {
  const { db } = await useAdmin()
  const { opponentIds, variantIds } = extractIds(gamesSummary)
  
  await db.collection('users').doc(userId).update({
    'IMMUTABLE.last5Games': JSON.stringify(gamesSummary),
    'IMMUTABLE.lastGamesOpponentIds': opponentIds,
    'IMMUTABLE.lastGamesVariantIds': variantIds,
  })
}
