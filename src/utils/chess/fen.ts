type PiecePlacement = {
  pieceId: string
  x: number
  y: number
}

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

export function placementsToFen(placements: PiecePlacement[]): string {
  // Get board height and width
  let boardWidth = 0
  let boardHeight = 0
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

export function removePiecesById(fen: string, id: string): string {
  const placements = fenToPlacements(fen)
  return placementsToFen(placements.filter((p) => p.pieceId !== id))
}
export function removePiecesByIds(fen: string, ids: string[]): string {
  const placements = fenToPlacements(fen)
  return placementsToFen(placements.filter((p) => !ids.includes(p.pieceId)))
}

export function removePieceAt(fen: string, coords: [number, number]): string {
  const placements = fenToPlacements(fen)
  return placementsToFen(placements.filter((p) => p.x !== coords[0] || p.y !== coords[1]))
}

export function addPieceAt(fen: string, coords: [number, number], id: string): string {
  const placements = fenToPlacements(fen)
  return placementsToFen([...placements, { pieceId: id, x: coords[0], y: coords[1] }])
}

export function getPieceAt(fen: string, coords: [number, number]): string | undefined {
  const placements = fenToPlacements(fen)
  return placements.find((p) => p.x === coords[0] && p.y === coords[1])?.pieceId
}
