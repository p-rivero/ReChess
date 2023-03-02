<template><div></div></template>

<script setup lang="ts">
  import type { GameState } from '@/protochess/interfaces';
  import { getProtochess } from '@/protochess/protochess'
  import type { ErrorMessageHandler } from '@/utils/ErrorMessageHandler'
  
  const props = defineProps<{
    state: GameState
    errorMsgHandler: ErrorMessageHandler
  }>()

  // Start async function
  check()
  
  async function check() {
    if (!checkPieces()) return
    if (!await checkProtochess()) return
    // Clear the error message and enable the publish button
    props.errorMsgHandler.clear()
  }
  
  
  function checkPieces(): boolean {
    for (let i = 0; i < props.state.pieceTypes.length; i++) {
      const piece = props.state.pieceTypes[i]
      if (!piece.displayName) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} doesn't have a name`, -1)
        return false
      }
      if (piece.ids[0] === '') {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} is missing a symbol for White`, -1)
        return false
      }
      if (piece.ids[1] === '') {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} is missing a symbol for Black`, -1)
        return false
      }
      if (hasDuplicateSymbol(i, 0)) return false
      if (hasDuplicateSymbol(i, 1)) return false
      if (!piece.ids[0] && !piece.ids[1]) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} must be available for at least 1 player`, -1)
        return false
      }
      if (piece.ids[0] && !piece.imageUrls[0]) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} is missing an image for White`, -1)
        return false
      }
      if (piece.ids[1] && !piece.imageUrls[1]) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} is missing an image for Black`, -1)
        return false
      }
      for (const square of piece.doubleJumpSquares) {
        if (square[0] >= props.state.boardWidth || square[1] >= props.state.boardHeight) {
          props.errorMsgHandler.show(`Piece ${pieceName(i)} can double jump at ${squareName(square)}, which is outside the board`, -1)
          return false
        }
      }
      for (const square of piece.promotionSquares) {
        if (square[0] >= props.state.boardWidth || square[1] >= props.state.boardHeight) {
          props.errorMsgHandler.show(`Piece ${pieceName(i)} promotes at ${squareName(square)}, which is outside the board`, -1)
          return false
        }
      }
      if (piece.ids[0] && piece.promoVals[0].length === 0 && piece.promotionSquares.length !== 0) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} (White) promotes at some squares, but has no pieces to promote to`, -1)
        return false
      }
      if (piece.ids[0] && piece.promoVals[0].length !== 0 && piece.promotionSquares.length === 0) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} (White) can promote to ${piece.promoVals[0]}, but has no promotion squares`, -1)
        return false
      }
      if (piece.ids[1] && piece.promoVals[1].length === 0 && piece.promotionSquares.length !== 0) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} (Black) promotes at some squares, but has no pieces to promote to`, -1)
        return false
      }
      if (piece.ids[1] && piece.promoVals[1].length !== 0 && piece.promotionSquares.length === 0) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} (Black) can promote to ${piece.promoVals[1]}, but has no promotion squares`, -1)
        return false
      }
      if (piece.castleFiles && props.state.pieceTypes.every(p => !p.isCastleRook)) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} castles as King, so it needs 1 or more pieces that castle as Rook`, -1)
        return false
      }
      if (piece.isCastleRook && props.state.pieceTypes.every(p => !p.castleFiles)) {
        props.errorMsgHandler.show(`Piece ${pieceName(i)} castles as Rook, so it needs 1 or more pieces that castle as King`, -1)
        return false
      }
    }
    return true
  }
  
  
  async function checkProtochess(): Promise<boolean> {
    try {
      const protochess = await getProtochess()
      await protochess.setState(props.state)
      // Search at depth 1 to see if the engine can find a move
      await protochess.getBestMove(1)
    } catch (e) {
      // Use priority -1, which is lower than the priority of text input errors
      props.errorMsgHandler.show(`Illegal starting position: ${e}`, -1)
      return false
    }
    return true
  }
  
  
  function pieceName(index: number): string {
    const piece = props.state.pieceTypes[index]
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
  
  function hasDuplicateSymbol(i: number, player: number): boolean {
    const piece = props.state.pieceTypes[i]
    const playerSym = piece.ids[player]
    if (!playerSym) return false
    if (piece.ids[1 - player] === playerSym) {
      props.errorMsgHandler.show(`Piece ${pieceName(i)} cannot have the same symbol '${playerSym}' for both White and Black`, -1)
      return true
    }
    for (let j = 0; j < i; j++) {
      const otherPiece = props.state.pieceTypes[j]
      if (playerSym === otherPiece.ids[0] || playerSym === otherPiece.ids[1]) {
        const first = Math.min(i, j) + 1
        const second = Math.max(i, j) + 1
        props.errorMsgHandler.show(`There are 2 pieces with the symbol '${playerSym}' (positions ${first} and ${second})`, -1)
        return true
      }
    }
    return false
  }
  
</script>
