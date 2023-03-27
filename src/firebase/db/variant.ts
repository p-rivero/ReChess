import { db } from '@/firebase'
import type { UserUpvotesDoc, VariantDoc, VariantIndexDoc } from '@/firebase/db/schema'
import type { Variant } from '@/protochess/types'

import { collection, addDoc, getDoc, doc, getDocs, setDoc, deleteDoc, serverTimestamp, query, where, getCountFromServer, orderBy } from 'firebase/firestore'

// Attempts to create a new variant in the database and returns the variant ID. Throws an error if the write fails.
export async function createVariant(userId: string, displayName: string, variant: Variant): Promise<string> {
  // Create the variant document
  const document: VariantDoc = {
    // May not match the initial state. When fetching the state, the name and description are overwritten with this fields
    name: variant.displayName.trim(),
    description: variant.description,
    IMMUTABLE: {
      creationTime: serverTimestamp(),
      creatorDisplayName: displayName,
      creatorId: userId,
      numUpvotes: 0,
      initialState: JSON.stringify(variant),
    },
  }
  const docRef = await addDoc(collection(db, 'variants'), document)
  return docRef.id
}

// Fetches the variant index from the database
export async function getVariantIndex(): Promise<VariantIndexDoc> {
  const document = await getDoc(doc(db, 'variantIndex', 'doc'))
  // If no variant has ever been created, the index document will not exist
  // This will never happen in production, but return an empty string in development to avoid errors
  if (!document.exists()) return { index: '' }
  return document.data() as VariantIndexDoc
}

// id -> VariantDoc
export async function getVariantById(id: string): Promise<VariantDoc | undefined> {
  const document = await getDoc(doc(db, 'variants', id))
  if (!document.exists()) return undefined
  return document.data() as VariantDoc
}

// Returns the number of variants with the given name
export async function getNumVariantsWithName(name: string): Promise<number> {
  const q = query(collection(db, 'variants'), where('name', '==', name))
  const count = await getCountFromServer(q)
  return count.data().count
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
  // Add the user's upvote. A cloud function will increment the variant's upvotes
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: serverTimestamp() }
  setDoc(doc(db, 'users', userId, 'upvotedVariants', variantId), upvoteDoc)
}

// Un-upvotes the variant for the user
export async function removeUpvoteVariant(userId: string, variantId: string): Promise<void> {
  // Remove the user's upvote. A cloud function will decrement the variant's upvotes
  deleteDoc(doc(db, 'users', userId, 'upvotedVariants', variantId))
}


// TODO: Add pagination
export async function getVariantList(order: 'newest' | 'upvotes'): Promise<[VariantDoc, string][]> {
  console.log('Fetching variant list', order)
  const orderQuery = order === 'newest' ?
    orderBy('IMMUTABLE.creationTime', 'desc') :
    orderBy('IMMUTABLE.numUpvotes', 'desc')
  const q = query(collection(db, 'variants'), orderQuery)
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => [doc.data() as VariantDoc, doc.id])
}
