import { db } from '@/firebase'
import type { VariantDoc } from '@/firebase/db/schema'
import type { Variant } from '@/protochess/types'

import { collection, addDoc, getDoc, doc, getDocs } from 'firebase/firestore'

// Attempts to create a new variant in the database and returns the variant ID. Throws an error if the write fails.
export async function createVariant(userId: string, userName: string, variant: Variant): Promise<string> {
  const document: VariantDoc = {
    // May not match the initial state. When fetching the state, the name and description are overwritten with this fields
    name: variant.displayName,
    description: variant.description,
    IMMUTABLE: {
      // Always the same as in initialState
      creatorDisplayName: userName,
      creatorId: userId,
      numUpvotes: 0,
      initialState: JSON.stringify(variant),
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
