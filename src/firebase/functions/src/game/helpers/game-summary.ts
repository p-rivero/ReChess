import type { GameDoc, GameSummary } from 'db/schema'

/**
 * Converts a game document to a game summary from the perspective of a player.
 * The game must have a winner (i.e. it must be finished).
 * @param {[string, GameDoc]} game The game to create a summary for ([gameId, gameDoc]])
 * @param {string} playerId ID of the white or black player
 * @return {GameSummary} The created game summary
 */
export function createGameSummary(game: [string, GameDoc], playerId: string): GameSummary {
  const [gameId, gameDoc] = game
  const playedSide = gameDoc.IMMUTABLE.whiteId === playerId ? 'white' : 'black'
  
  const result = playerResult(playedSide, gameDoc.winner)
  
  const [opponentId, opponentName] = playedSide === 'white' ?
    [gameDoc.IMMUTABLE.blackId, gameDoc.IMMUTABLE.blackDisplayName] :
    [gameDoc.IMMUTABLE.whiteId, gameDoc.IMMUTABLE.whiteDisplayName]
  
  return {
    gameId,
    variantId: gameDoc.IMMUTABLE.variantId,
    variantName: gameDoc.IMMUTABLE.variant.name,
    timeCreatedMs: gameDoc.IMMUTABLE.timeCreated.toMillis(),
    playedSide,
    result,
    opponentId,
    opponentName,
  }
}

function playerResult(side: 'white'|'black', winner: 'white'|'black'|'draw'|null): 'win'|'loss'|'draw' {
  if (!winner) throw new Error('Attempted to make summary of unfinished game')
  if (winner === 'draw') return 'draw'
  return winner === side ? 'win' : 'loss'
}


type ExtractedIds = {
  variantIds: string[]
  opponentIds: string[]
}

/**
 * Extracts the list of variant and opponent IDs from a games list.
 * Useful for updating the indexable fields of a user profile.
 * @param {GameSummary[]} games The list of games to extract the data from
 * @return {ExtractedIds} The list of variant and opponent IDs
 */
export function extractIds(games: GameSummary[]): ExtractedIds {
  const variantIds = removeNullsAndDuplicates(games.map(game => game.variantId))
  const opponentIds = removeNullsAndDuplicates(games.map(game => game.opponentId))
  return { variantIds, opponentIds }
}

function removeNullsAndDuplicates(array: (string|null)[]): string[] {
  return [...new Set(array.filter(s => s))] as string[]
}
