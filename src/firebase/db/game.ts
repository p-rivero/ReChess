import { db } from '@/firebase'
import { doc, updateDoc } from '@firebase/firestore'
import { query, collection, where, orderBy, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import type { GameDoc } from './schema'

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
  if (winner) {
    // The game is over, also trigger the game over cloud function
    const batch = writeBatch(db)
    batch.update(getGameRef(gameId), update)
    const triggerRef = doc(db, 'games', gameId, 'gameOverTrigger', 'doc')
    batch.set(triggerRef, { gameOverTime: serverTimestamp() })
    await batch.commit()
  } else {
    // Normal game update
    await updateDoc(getGameRef(gameId), update)
  }
}


// Returns the game document and id of all games that the user has played
export async function getUserGames(userId: string): Promise<[GameDoc, string][]> {
  const q = query(
    collection(db, 'games'),
    where('IMMUTABLE.players', 'array-contains', userId),
    orderBy('IMMUTABLE.timeCreated', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => [doc.data() as GameDoc, doc.id])
}
