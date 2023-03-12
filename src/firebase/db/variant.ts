import { db } from '@/firebase'
import type { VariantDoc } from '@/firebase/db/schema'
import type { GameState } from '@/protochess/types'

import { collection, addDoc } from 'firebase/firestore'

// Attempts to create a new variant in the database and returns the variant ID. Throws an error if
// the variant name is empty, or if the write fails.
export async function createVariant(userId: string, state: GameState): Promise<string> {
  if (!state.variantDisplayName) {
    throw new Error('Variant name cannot be empty')
  }
  const document: VariantDoc = {
    name: state.variantDisplayName,
    creatorId: userId,
    description: state.variantDescription ?? '',
    initialState: JSON.stringify(state),
    SERVER: {
      numUpvotes: 0,
    }
  }
  const docRef = await addDoc(collection(db, "variants"), document)
  return docRef.id
}

