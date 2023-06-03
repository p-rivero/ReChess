import { useAdmin, batchedUpdate } from '../../helpers'

/**
 * Stops immediately all the ongoing games for a user. The other player is declared the winner.
 * 
 * **Important:** Call this function *before* removing the user ID from the games.
 * @param {string} userId The ID of the user to stop games for.
 * @return {Promise<void>} A promise that resolves when the function is complete
 */
export async function stopOngoingGames(userId: string): Promise<void> {
  const { db } = await useAdmin()
  
  const ongoingGamesWhite = await db.collection('games')
    .where('IMMUTABLE.whiteId', '==', userId)
    .where('winner', '==', null)
    .get()
  await batchedUpdate(ongoingGamesWhite, (batch, ref) => {
    batch.update(ref, {
      'playerToMove': 'game-over',
      'winner': 'black',
      'IMMUTABLE.calledFinishGame': true,
    })
  })
  
  const ongoingGamesBlack = await db.collection('games')
    .where('IMMUTABLE.blackId', '==', userId)
    .where('winner', '==', null)
    .get()
  await batchedUpdate(ongoingGamesBlack, (batch, ref) => {
    batch.update(ref, {
      'playerToMove': 'game-over',
      'winner': 'white',
      'IMMUTABLE.calledFinishGame': true,
    })
  })
}
