import type { MakeMoveFlag, MakeMoveWinner, Player } from '@/protochess/types'

/**
 * Returns a message (in **Markdown** format) to display to the user when the game is over.
 * @param {MakeMoveFlag} flag The flag that caused the game to end
 * @param {Player} playerToMove The player that was to move when the game ended
 */
export function gameOverMessage(flag: MakeMoveFlag, winner: MakeMoveWinner, playerToMove: Player): string {
  const toMoveUpper = playerToMove === 'white' ? 'White' : 'Black'
  const loserUpper = winner === 'white' ? 'Black' : 'White'
  if (flag === 'Checkmate') {
    return `**Checkmate:** ${toMoveUpper} has no legal moves and is in check.`
  }
  if (flag === 'Stalemate') {
    return `**Stalemate:** ${toMoveUpper} has no legal moves, but is not in check.`
  }
  if (flag === 'LeaderCaptured') {
    return `The **${toMoveUpper}** leader has been **captured** or has exploded. 
    \n\nIt's ${toMoveUpper}'s turn, but their designated leader piece is not on the board.`
  }
  if (flag === 'AllPiecesCaptured') {
    return `All of **${toMoveUpper}**'s pieces have been **captured**.
    \n\nIt's ${toMoveUpper}'s turn, but they have no pieces on the board.`
  }
  if (flag === 'PieceInWinSquare') {
    return `One of **${toMoveUpper}**'s pieces has reached a **winning square**.`
  }
  if (flag === 'CheckLimit') {
    return `**${toMoveUpper}** has been in check too many times.`
  }
  if (flag === 'Repetition') {
    return 'The same position has been **repeated** too many times.'
  }
  if (flag === 'Resignation') {
    return `${loserUpper} has **resigned**.`
  }
  return ''
}
