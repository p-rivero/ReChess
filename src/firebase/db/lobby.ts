import { db } from '@/firebase'
import { collection } from '@firebase/firestore'

export function getLobbySlots(variantId: string) {
  return collection(db, 'variants', variantId, 'lobby')
}
