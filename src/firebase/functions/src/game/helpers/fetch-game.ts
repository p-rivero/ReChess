import { useAdmin } from '../../helpers'
import type { GameDoc } from 'db/schema'

/**
 * Get a game document, given its ID.
 * @param {string} gameId The ID of the game to fetch
 * @return {Promise<GameDoc|undefined>} A promise that resolves to the game document, or undefined if it doesn't exist
 */
export async function fetchGameDoc(gameId: string): Promise<GameDoc | undefined> {
  const { db } = await useAdmin()
  const gameSnapshot = await db.collection('games').doc(gameId).get()
  return gameSnapshot.data() as GameDoc | undefined
}
