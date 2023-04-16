import { db } from '@/firebase'
import { doc, updateDoc } from '@firebase/firestore'

export function getGameRef(gameId: string) {
  return doc(db, 'games', gameId)
}

export async function updateGame(
  gameId: string,
  moveHistory: string,
  playerToMove: 'white' | 'black' | 'game-over',
  winner: 'white' | 'black' | 'draw' | undefined
) {
  const update = {
    moveHistory,
    playerToMove,
    winner: winner ?? null,
  }
  await updateDoc(getGameRef(gameId), update)
}
