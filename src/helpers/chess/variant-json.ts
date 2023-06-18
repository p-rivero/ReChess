import { fenToPlacements } from './fen'
import { isVariant } from '@/protochess/types.guard'
import type { Variant } from '@/protochess/types'

export function parseVariantJson(json: string): Variant | undefined {
  try {
    const obj = JSON.parse(json)
    if (isValidVariant(obj)) {
      return obj
    }
  } catch (e) {
    // ignore error and return undefined
  }
}


function isValidVariant(state: unknown): state is Variant {
  if (!isVariant(state)) return false
  if (state.pieceTypes.length > 26) return false
  if (state.boardWidth < 1 || state.boardWidth > 16) return false
  if (state.boardHeight < 1 || state.boardHeight > 16) return false
  if (fenToPlacements(state.fen).some(p => p.x < 0 || p.x >= state.boardWidth || p.y < 0 || p.y >= state.boardHeight)) return false
  return true
}
