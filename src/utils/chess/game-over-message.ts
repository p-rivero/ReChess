import type { MakeMoveFlag, Player } from '@/protochess/types'

/**
 * Returns a message (in **Markdown** format) to display to the user when the game is over.
 * @param {MakeMoveFlag} flag The flag that caused the game to end
 * @param {Player} playerToMove The player that was to move when the game ended
 */
export function getMessage(flag: MakeMoveFlag, playerToMove: Player): string {
  const playerUpper = playerToMove === 'white' ? 'White' : 'Black'
  if (flag === 'Checkmate') {
    return `**Checkmate:** ${playerUpper} has no legal moves and is in check.`
  }
  if (flag === 'Stalemate') {
    return `**Stalemate:** ${playerUpper} has no legal moves, but is not in check.`
  }
  if (flag === 'LeaderCaptured') {
    return `The **${playerUpper}** leader has been **captured** or has exploded. 
    \n\nIt's ${playerUpper}'s turn, but their designated leader piece is not on the board.`
  }
  if (flag === 'AllPiecesCaptured') {
    return `All of **${playerUpper}**'s pieces have been **captured**.
    \n\nIt's ${playerUpper}'s turn, but they have no pieces on the board.`
  }
  if (flag === 'PieceInWinSquare') {
    return `One of **${playerUpper}**'s pieces has reached a **winning square**.`
  }
  if (flag === 'CheckLimit') {
    return `**${playerUpper}** has been in check too many times.`
  }
  if (flag === 'Repetition') {
    return 'The same position has been **repeated** too many times.'
  }
  return ''
}
