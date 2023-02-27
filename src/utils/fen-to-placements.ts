import type { GameState, PiecePlacement } from '@/protochess/interfaces'

export function fenToPlacements(fen: string): PiecePlacement[] {
  const placements: PiecePlacement[] = []
  const rows = fen.split('/')
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
          y,
        })
        x++
      }
    }
  }
  return placements
}

export function placementsToFen(state: GameState): string {
  const rows: string[] = []
  for (let y = 0; y < state.boardHeight; y++) {
    let row = ''
    let empty = 0
    for (let x = 0; x < state.boardWidth; x++) {
      const piece = state.pieces.find((p) => p.x === x && p.y === y)
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

// TODO: Remove this file
