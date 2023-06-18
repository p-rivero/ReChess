export type LetterCoord = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p'
export type NumberCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

export type Coord = `${LetterCoord}${NumberCoord}`

import * as cg from 'chessgroundx/types'
import type { MoveInfo } from '@/protochess/types'

export function pairToCoords(pair: [number, number]): Coord {
  const [x, y] = pair
  const letter = String.fromCharCode('a'.charCodeAt(0) + x) as LetterCoord
  const number = (y + 1) as NumberCoord
  return `${letter}${number}`
}

export function coordsToPair(coords: string): [number, number] {
  if (!isCoords(coords)) throw new Error(`Invalid coords: ${coords}`)
  const letter = coords[0]
  const number = coords.slice(1)
  const x = letter.charCodeAt(0) - 'a'.charCodeAt(0)
  const y = Number(number) - 1
  return [x, y]
}

export function isCoords(coords: string): coords is Coord {
  const letter = coords[0]
  const numberStr = coords.slice(1)
  const number = Number(numberStr)
  return letter >= 'a' && letter <= 'p' && number >= 1 && number <= 16
}

export function numberToLetter(number: number|undefined): LetterCoord|undefined {
  if (number === undefined) return undefined
  if (number < 0 || number > 15) return undefined
  return String.fromCharCode('a'.charCodeAt(0) + number) as LetterCoord
}

export function letterToNumber(letter: string): number {
  return letter.charCodeAt(0) - 'a'.charCodeAt(0)
}


// Interface with chessgroundx

export function keyToPosition(key: cg.Key): [number, number] {
  const keyLetter = key[0] as cg.File
  const keyNumber = key[1] as cg.Rank
  const file = cg.files.indexOf(keyLetter)
  const rank = cg.ranks.indexOf(keyNumber)
  return [file, rank]
}

export function positionToKey(position: [number, number]): cg.Key {
  return `${cg.files[position[0]]}${cg.ranks[position[1]]}`
}


// Display moves

export function moveToString(move: MoveInfo): string {
  const fromStr = pairToCoords(move.from)
  const toStr = pairToCoords(move.to)
  const promotionStr = move.promotion ? `=${move.promotion}` : ''
  return `${fromStr}${toStr}${promotionStr}`
}

export function parseMove(move: string): MoveInfo {
  const moveRegex = /^([a-p])(\d{1,2})([a-p])(\d{1,2})(=..?)?$/
  const match = moveRegex.exec(move)
  if (!match) {
    throw new Error(`Invalid move string: "${move}"`)
  }
  
  const [, fromFile, fromRank, toFile, toRank, promotion] = match
  const fromX = fromFile.charCodeAt(0) - 'a'.charCodeAt(0)
  const fromY = parseInt(fromRank) - 1
  const toX = toFile.charCodeAt(0) - 'a'.charCodeAt(0)
  const toY = parseInt(toRank) - 1
  
  if (fromX < 0 || fromX > 15 || fromY < 0 || fromY > 15) {
    throw new Error(`Invalid move: "${move}"`)
  }
  // Skip '='
  const promotionId = promotion ? promotion[1] : undefined
  
  return {
    from: [fromX, fromY],
    to: [toX, toY],
    promotion: promotionId,
  }
}
