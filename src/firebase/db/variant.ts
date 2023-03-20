import { db } from '@/firebase'
import type { UserUpvotesDoc, VariantDoc, VariantUpvotesDoc } from '@/firebase/db/schema'
import type { Variant } from '@/protochess/types'

import { collection, addDoc, getDoc, doc, getDocs, setDoc, deleteDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore'

// Attempts to create a new variant in the database and returns the variant ID. Throws an error if the write fails.
export async function createVariant(userId: string, displayName: string, variant: Variant): Promise<string> {
  // We need to add a new document to the variants collection and then create the upvotes document.
  // Ideally this would be done in a single batch, but the variant ID is not known until after the variant is created.
  
  // Create the variant document
  const document: VariantDoc = {
    // May not match the initial state. When fetching the state, the name and description are overwritten with this fields
    name: variant.displayName,
    description: variant.description,
    IMMUTABLE: {
      creatorDisplayName: displayName,
      creatorId: userId,
      initialState: JSON.stringify(variant),
    }
  }
  const docRef = await addDoc(collection(db, 'variants'), document)
  const variantId = docRef.id
  try {
    // Create the upvotes document
    const upvotesDoc: VariantUpvotesDoc = { numUpvotes: 0 }
    await setDoc(doc(db, 'variants', variantId, 'upvotes', 'doc'), upvotesDoc)
  } catch (error) {
    // If the upvotes document fails to be created, delete the variant document
    await deleteDoc(docRef)
    throw error
  }
  return variantId
}

// id -> VariantDoc
export async function getVariantById(id: string): Promise<VariantDoc | undefined> {
  const document = await getDoc(doc(db, 'variants', id))
  if (!document.exists()) return undefined
  return document.data() as VariantDoc
}
// id -> VariantUpvotesDoc
export async function getVariantUpvotes(id: string): Promise<VariantUpvotesDoc | undefined> {
  const document = await getDoc(doc(db, 'variants', id, 'upvotes', 'doc'))
  if (!document.exists()) return undefined
  return document.data() as VariantUpvotesDoc
}


// Returns true if the user has upvoted the variant
export async function hasUserUpvoted(userId: string | undefined, variantId: string): Promise<boolean> {
  if (!userId) return false
  try {
    const document = await getDoc(doc(db, 'users', userId, 'upvotedVariants', variantId))
    return document.exists()
  } catch (error) {
    console.warn('Failed to check if user has upvoted variant.', error)
    return false
  }
}

// Upvotes the variant for the user
export async function upvoteVariant(userId: string, variantId: string): Promise<void> {
  const batch = writeBatch(db)
  // Increment the variant's upvotes
  batch.update(doc(db, 'variants', variantId, 'upvotes', 'doc'), { numUpvotes: increment(1) })
  // Add the user's upvote
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: serverTimestamp() }
  batch.set(doc(db, 'users', userId, 'upvotedVariants', variantId), upvoteDoc)
  await batch.commit()
}

// Un-upvotes the variant for the user
export async function removeUpvoteVariant(userId: string, variantId: string): Promise<void> {
  const batch = writeBatch(db)
  // Decrement the variant's upvotes
  batch.update(doc(db, 'variants', variantId, 'upvotes', 'doc'), { numUpvotes: increment(-1) })
  // Remove the user's upvote
  batch.delete(doc(db, 'users', userId, 'upvotedVariants', variantId))
  await batch.commit()
}


// TODO: Add pagination and ordering
export async function getVariantList(): Promise<[VariantDoc, string][]> {
  const querySnapshot = await getDocs(collection(db, 'variants'))
  return querySnapshot.docs.map(doc => [doc.data() as VariantDoc, doc.id])
}
