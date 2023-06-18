import type { PieceId } from '@/protochess/types'

interface PiecePlacement {
  pieceId: string
  x: number
  y: number
}

/**
 * Parses a FEN string into a list of piece placements. The placements include
 * walls, which are represented by the pieceId `'*'`.
 * @param fen The FEN string to convert to a list of piece placements
 * @returns A list of piece placements
 */
export function fenToPlacements(fen: string): PiecePlacement[] {
  const placements: PiecePlacement[] = []
  const rows = fen.split('/')
  const height = rows.length
  // Allow 2-digit numbers for skipping multiple squares
  for (let y = 0; y < rows.length; y++) {
    let x = 0
    let skip = 0
    for (const char of rows[y]) {
      if (char >= '0' && char <= '9') {
        skip = skip * 10 + Number(char)
      } else {
        x += skip
        skip = 0
        placements.push({
          pieceId: char,
          x,
          y: height - 1 - y,
        })
        x++
      }
    }
  }
  return placements
}

/**
 * Converts a list of piece placements into a FEN string.
 * @param placements The list of piece placements to convert to a FEN string,
 * including walls (represented by the pieceId `'*'`)
 * @returns A FEN string
 */
export function placementsToFen(placements: PiecePlacement[]): string {
  // Get board height and width
  let boardWidth = 1
  let boardHeight = 1
  for (const placement of placements) {
    boardWidth = Math.max(boardWidth, placement.x + 1)
    boardHeight = Math.max(boardHeight, placement.y + 1)
  }
  // Generate FEN
  const rows: string[] = []
  for (let y = boardHeight - 1; y >= 0; y--) {
    let row = ''
    let empty = 0
    for (let x = 0; x < boardWidth; x++) {
      const piece = placements.find((p) => p.x === x && p.y === y)
      if (piece) {
        if (empty) {
          row += empty
          empty = 0
        }
        row += piece.pieceId
      } else {
        empty++
      }
    }
    if (empty) {
      row += empty
    }
    rows.push(row)
  }
  return rows.join('/')
}

/**
 * Removes all pieces from the FEN string with the given id.
 * @param fen The FEN string to remove the piece from
 * @param id The id of the piece to remove
 * @returns The new FEN string
 */
export function removePiecesById(fen: string, id: PieceId): string {
  const placements = fenToPlacements(fen)
  return placementsToFen(placements.filter((p) => p.pieceId !== id))
}
