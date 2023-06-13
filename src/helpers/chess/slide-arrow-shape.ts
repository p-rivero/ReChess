import { positionToKey } from '@/helpers/chess/chess-coords'
import type { DrawShape } from 'chessgroundx/draw'

type Direction = 'left' | 'right' | 'up' | 'down' | 'upleft' | 'upright' | 'downleft' | 'downright'

/**
 * Returns a shape that draws an arrow from the given starting position to the edge of the board
 * in the given direction. It assumes that the board is square.
 * @param start The starting position of the arrow
 * @param boardSize The width and height of the board
 * @param arrowDir The direction of the arrow
 * @param brush The brush to use for the arrow
 * @returns A shape that draws an arrow from the given starting position to the edge of the board
 */
export default function(start: [number, number], boardSize: number, arrowDir: Direction, brush: string): DrawShape {
  return {
    orig: positionToKey(start),
    dest: positionToKey(getArrowEnd(start, boardSize, arrowDir)),
    brush,
  }
}

function getArrowEnd(start: [number, number], boardSize: number, arrowDir: Direction): [number, number] {
  const [x, y] = start
  const maxSize = boardSize - 1
  switch (arrowDir) {
    case 'left':
      return [0, y]
    case 'right':
      return [maxSize, y]
    case 'up':
      return [x, maxSize]
    case 'down':
      return [x, 0]
    case 'upleft':
      return [
        Math.max(x + y - maxSize, 0),
        Math.min(x + y, maxSize),
      ]
    case 'upright':
      return [
        x > y ? maxSize : maxSize + (x - y),
        x > y ? maxSize - (x - y) : maxSize,
      ]
    case 'downleft':
      return [
        x > y ? x - y : 0,
        x > y ? 0 : y - x,
      ]
    case 'downright':
      return [
        Math.min(x + y, maxSize),
        Math.max(x + y - maxSize, 0),
      ]
  }
}
