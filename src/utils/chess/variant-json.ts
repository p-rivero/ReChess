import type { Variant } from '@/protochess/types'
import { isVariant } from '@/protochess/types.guard'

export function parseVariantJson(json: string): Variant | undefined {
  try {
    const obj = JSON.parse(json)
    if (isValidVariant(obj)) {
      return obj
    }
  } catch (e) {
    // ignore error and return undefined
  }
  return undefined
}


function isValidVariant(state: unknown): state is Variant {
  if (!isVariant(state)) return false
  if (state.pieceTypes.length > 26) return false
  if (state.boardWidth < 1 || state.boardWidth > 16) return false
  if (state.boardHeight < 1 || state.boardHeight > 16) return false
  if (state.invalidSquares.some(square => square[0] < 0 || square[0] >= state.boardWidth || square[1] < 0 || square[1] >= state.boardHeight)) return false
  if (state.pieces.some(piece => piece.x < 0 || piece.x >= state.boardWidth || piece.y < 0 || piece.y >= state.boardHeight)) return false
  if (state.epSquareAndVictim &&
    (  state.epSquareAndVictim[0][0] < 0
    || state.epSquareAndVictim[0][0] >= state.boardWidth
    || state.epSquareAndVictim[0][1] < 0
    || state.epSquareAndVictim[0][1] >= state.boardHeight
    || state.epSquareAndVictim[1][0] < 0
    || state.epSquareAndVictim[1][0] >= state.boardWidth
    || state.epSquareAndVictim[1][1] < 0
    || state.epSquareAndVictim[1][1] >= state.boardHeight)) return false
  if (state?.timesInCheck?.some(times => times < 0 || times > 200)) return false
  return true
}
