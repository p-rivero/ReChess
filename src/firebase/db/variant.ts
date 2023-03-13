import { db } from '@/firebase'
import type { VariantDoc } from '@/firebase/db/schema'
import type { GameState } from '@/protochess/types'

import { collection, addDoc, getDoc, doc, getDocs } from 'firebase/firestore'

// Attempts to create a new variant in the database and returns the variant ID. Throws an error if
// the variant name is empty, or if the write fails.
export async function createVariant(userId: string, userName: string, state: GameState): Promise<string> {
  if (!state.variantDisplayName) {
    throw new Error('Variant name cannot be empty')
  }
  if (state.variantUID) {
    throw new Error('This variant already has an ID assigned, make sure to only publish drafts')
  }
  const document: VariantDoc = {
    name: state.variantDisplayName,
    description: state.variantDescription ?? '',
    creatorDisplayName: userName,
    SERVER: {
      creatorId: userId,
      numUpvotes: 0,
      initialState: JSON.stringify(state),
    }
  }
  const docRef = await addDoc(collection(db, "variants"), document)
  return docRef.id
}

// id -> VariantDoc
export async function getVariantById(id: string): Promise<VariantDoc | undefined> {
  const document = await getDoc(doc(db, "variants", id))
  if (!document.exists()) return undefined
  return document.data() as VariantDoc
}

// TODO: Add pagination and ordering
export async function getVariantList(): Promise<[VariantDoc, string][]> {
  const querySnapshot = await getDocs(collection(db, "variants"))
  return querySnapshot.docs.map(doc => [doc.data() as VariantDoc, doc.id])
}
