import type { MakeMoveFlag, Player } from "@/protochess/types"

export function getMessage(flag: MakeMoveFlag, playerToMove: Player): string {
  const playerUpper = playerToMove === 'white' ? 'White' : 'Black'
  if (flag === 'Checkmate') {
    return `Checkmate: ${playerUpper} has no legal moves and is in check.`
  }
  if (flag === 'Stalemate') {
    return `Stalemate: ${playerUpper} has no legal moves, but is not in check.`
  }
  if (flag === 'LeaderCaptured') {
    return `The ${playerUpper} leader has been captured or has exploded.
      It is ${playerUpper}'s turn, but their designated leader piece is not on the board.`
  }
  if (flag === 'AllPiecesCaptured') {
    return `All ${playerUpper}'s pieces have been captured.
      It is ${playerUpper}'s turn, but they have no pieces left on the board.`
  }
  if (flag === 'PieceInWinSquare') {
    return `One of ${playerUpper}'s pieces has reached a winning square.`
  }
  if (flag === 'CheckLimit') {
    return `${playerUpper} has been in check too many times.`
  }
  if (flag === 'Repetition') {
    return `The same position has been repeated too many times.`
  }
  return ''
}
