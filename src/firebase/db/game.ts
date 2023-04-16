import { db } from '@/firebase'
import { doc } from '@firebase/firestore'

export function getGameRef(gameId: string) {
  return doc(db, 'games', gameId)
}
