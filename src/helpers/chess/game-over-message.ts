import type { MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'

/**
 * Returns a message (in **Markdown** format) to display to the user when the game is over.
 * @param {MakeMoveFlag} flag The flag that caused the game to end
 * @param {Player} playerToMove The player that was to move when the game ended
 */
export function gameOverMessage(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player): string {
  const nameToMove = playerToMove === 'white' ? 'White' : 'Black'
  const nameJustMoved = playerToMove === 'white' ? 'Black' : 'White'
  const nameLoser = winner === 'white' ? 'Black' : 'White'
  if (flag === 'Checkmate') {
    return `**Checkmate:** ${nameToMove} has no legal moves and is in check.`
  }
  if (flag === 'Stalemate') {
    return `**Stalemate:** ${nameToMove} has no legal moves, but is not in check.`
  }
  if (flag === 'LeaderCaptured') {
    return `The **${nameToMove}** leader has been **captured** or has exploded. 
    \n\nIt's ${nameToMove}'s turn, but their designated leader piece is not on the board.`
  }
  if (flag === 'AllPiecesCaptured') {
    return `All of **${nameToMove}**'s pieces have been **captured**.
    \n\nIt's ${nameToMove}'s turn, but they have no pieces on the board.`
  }
  if (flag === 'PieceInWinSquare') {
    return `One of **${nameJustMoved}**'s pieces has reached a **winning square**.`
  }
  if (flag === 'CheckLimit') {
    return `**${nameToMove}** has been in check too many times.`
  }
  if (flag === 'Repetition') {
    return 'The same position has been **repeated** too many times.'
  }
  if (flag === 'Resignation') {
    return `${nameLoser} has **resigned**.`
  }
  return ''
}
