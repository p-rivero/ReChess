import type { GameState } from '@/protochess/types'
import { isGameState } from '@/protochess/types.guard'

export function parseGameStateJson(json: string): GameState | undefined {
  try {
    const obj = JSON.parse(json)
    if (isValidGameState(obj)) {
      return obj
    }
  } catch (e) {
    // ignore error and return undefined
  }
  return undefined
}


function isValidGameState(state: any): state is GameState {
  if (!isGameState(state)) return false
  if (state.pieceTypes.length > 26) return false
  if (state.boardWidth < 1 || state.boardWidth > 16) return false
  if (state.boardHeight < 1 || state.boardHeight > 16) return false
  if (state.invalidSquares.some((square: any) => square.x < 0 || square.x >= state.boardWidth || square.y < 0 || square.y >= state.boardHeight)) return false
  if (state.pieces.some((piece: any) => piece.x < 0 || piece.x >= state.boardWidth || piece.y < 0 || piece.y >= state.boardHeight)) return false
  if (state.epSquareAndVictim &&
    (  state.epSquareAndVictim[0][0] < 0
    || state.epSquareAndVictim[0][0] >= state.boardWidth
    || state.epSquareAndVictim[0][1] < 0
    || state.epSquareAndVictim[0][1] >= state.boardHeight
    || state.epSquareAndVictim[1][0] < 0
    || state.epSquareAndVictim[1][0] >= state.boardWidth
    || state.epSquareAndVictim[1][1] < 0
    || state.epSquareAndVictim[1][1] >= state.boardHeight)) return false
  if (state?.timesInCheck?.some((times: any) => times < 0 || times > 200)) return false
  return true
}
