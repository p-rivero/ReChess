type LetterCoord = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p'
type NumberCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

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
  console.log(letter, number)
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
