import { getProtochess } from '@/protochess'
import type { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
import type { FullPieceDef, InitialState, Variant } from '@/protochess/types'

export async function checkState(variant: Variant, errorMsgHandler: ErrorMessageHandler): Promise<void> {
  if (!checkPieces(variant, errorMsgHandler)) return
  try {
    await checkProtochess(variant)
    // Clear the error message and enable the publish button
    errorMsgHandler.clear()
  } catch (e) {
    // Use priority -1, which is lower than the priority of text input errors
    errorMsgHandler.show(`Illegal starting position: ${e}`, -1)
  }
}


function checkPieces(state: Variant, errorMsgHandler: ErrorMessageHandler): boolean {
  for (let i = 0; i < state.pieceTypes.length; i++) {
    const piece = state.pieceTypes[i]
    if (!piece.displayName) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} doesn't have a name`, -1)
      return false
    }
    if (piece.ids[0] === '') {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} is missing a symbol for White`, -1)
      return false
    }
    if (piece.ids[1] === '') {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} is missing a symbol for Black`, -1)
      return false
    }
    if (checkDuplicateSymbol(i, 0, state, errorMsgHandler)) return false
    if (checkDuplicateSymbol(i, 1, state, errorMsgHandler)) return false
    if (!piece.ids[0] && !piece.ids[1]) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} must be available for at least 1 player`, -1)
      return false
    }
    if (piece.ids[0] && !piece.imageUrls[0]) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} is missing an image for White`, -1)
      return false
    }
    if (piece.ids[1] && !piece.imageUrls[1]) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} is missing an image for Black`, -1)
      return false
    }
    for (const square of piece.doubleJumpSquares) {
      if (square[0] >= state.boardWidth || square[1] >= state.boardHeight) {
        errorMsgHandler.show(`Piece ${pieceName(i, piece)} can double jump at ${squareName(square)}, which is outside the board`, -1)
        return false
      }
    }
    for (const square of piece.promotionSquares) {
      if (square[0] >= state.boardWidth || square[1] >= state.boardHeight) {
        errorMsgHandler.show(`Piece ${pieceName(i, piece)} promotes at ${squareName(square)}, which is outside the board`, -1)
        return false
      }
    }
    if (piece.ids[0] && piece.promoVals[0].length === 0 && piece.promotionSquares.length !== 0) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} (White) promotes at some squares, but has no pieces to promote to`, -1)
      return false
    }
    if (piece.ids[0] && piece.promoVals[0].length !== 0 && piece.promotionSquares.length === 0) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} (White) can promote to ${piece.promoVals[0]}, but has no promotion squares`, -1)
      return false
    }
    if (piece.ids[1] && piece.promoVals[1].length === 0 && piece.promotionSquares.length !== 0) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} (Black) promotes at some squares, but has no pieces to promote to`, -1)
      return false
    }
    if (piece.ids[1] && piece.promoVals[1].length !== 0 && piece.promotionSquares.length === 0) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} (Black) can promote to ${piece.promoVals[1]}, but has no promotion squares`, -1)
      return false
    }
    if (piece.castleFiles && state.pieceTypes.every(p => !p.isCastleRook)) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} castles as King, so it needs 1 or more pieces that castle as Rook`, -1)
      return false
    }
    if (piece.isCastleRook && state.pieceTypes.every(p => !p.castleFiles)) {
      errorMsgHandler.show(`Piece ${pieceName(i, piece)} castles as Rook, so it needs 1 or more pieces that castle as King`, -1)
      return false
    }
  }
  return true
}


async function checkProtochess(state: InitialState): Promise<void> {
  // validatePosition() is fast, use the UI instance
  const protochess = await getProtochess('ui')
  await protochess.setState({ initialState: state, moveHistory: [] })
  await protochess.validatePosition()
}


function pieceName(index: number, piece: FullPieceDef): string {
  if (piece.displayName) {
    return `"${piece.displayName}"`
  }
  let name = `at position ${index + 1}`
  if (piece.ids[0] && piece.ids[1]) {
    name += ` ('${piece.ids[0]}', '${piece.ids[1]}')`
  } else if (piece.ids[0]) {
    name += ` ('${piece.ids[0]}')`
  } else if (piece.ids[1]) {
    name += ` ('${piece.ids[1]}')`
  }
  return name
}

function squareName(square: [number, number]): string {
  return `${String.fromCharCode(square[0] + 97)}${square[1] + 1}`
}

function checkDuplicateSymbol(i: number, player: number, state: Variant, errorMsgHandler: ErrorMessageHandler): boolean {
  const piece = state.pieceTypes[i]
  const playerSym = piece.ids[player]
  if (!playerSym) return false
  if (piece.ids[1 - player] === playerSym) {
    errorMsgHandler.show(`Piece ${pieceName(i, piece)} cannot have the same symbol '${playerSym}' for both White and Black`, -1)
    return true
  }
  for (let j = 0; j < i; j++) {
    const otherPiece = state.pieceTypes[j]
    if (playerSym === otherPiece.ids[0] || playerSym === otherPiece.ids[1]) {
      const piece1 = pieceName(i, piece)
      const piece2 = pieceName(j, otherPiece)
      errorMsgHandler.show(`There are 2 pieces with the symbol '${playerSym}' (${piece1} and ${piece2})`, -1)
      return true
    }
  }
  return false
}