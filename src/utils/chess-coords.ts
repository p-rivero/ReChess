type LetterCoord = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p'
type NumberCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

import * as cg from 'chessgroundx/types'

export function pairToCoords(pair: [number, number]): `${LetterCoord}${NumberCoord}` {
  const [x, y] = pair
  const letter = String.fromCharCode('a'.charCodeAt(0) + x) as LetterCoord
  const number = (y + 1) as NumberCoord
  return `${letter}${number}` as `${LetterCoord}${NumberCoord}`
}

export function coordsToPair(coords: string): [number, number] {
  if (!isCoords(coords)) throw new Error(`Invalid coords: ${coords}`)
  const letter = coords[0]
  const number = coords.slice(1)
  const x = letter.charCodeAt(0) - 'a'.charCodeAt(0)
  const y = Number(number) - 1
  return [x, y]
}

export function isCoords(coords: string): coords is `${LetterCoord}${NumberCoord}` {
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