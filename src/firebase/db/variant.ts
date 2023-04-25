import { db } from '@/firebase'
import type { UserUpvotesDoc, VariantDoc, VariantIndexDoc } from '@/firebase/db/schema'
import type { Variant } from '@/protochess/types'

import { Timestamp, addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'

// Attempts to create a new variant in the database and returns the variant ID. Throws an error if the write fails.
export async function createVariant(userId: string, displayName: string, variant: Variant): Promise<string> {
  // Create the variant document
  const document: VariantDoc = {
    // May not match the initial state. When fetching the state, the name and description are overwritten with this fields
    name: variant.displayName.trim(),
    description: variant.description,
    creationTime: serverTimestamp() as Timestamp,
    creatorDisplayName: displayName,
    creatorId: userId,
    numUpvotes: 0,
    popularity: 0,
    initialState: JSON.stringify(variant),
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: serverTimestamp() as Timestamp,
  }
  setDoc(doc(db, 'users', userId, 'upvotedVariants', variantId), upvoteDoc)
}

// Un-upvotes the variant for the user
export async function removeUpvoteVariant(userId: string, variantId: string): Promise<void> {
  // Remove the user's upvote. A cloud function will decrement the variant's upvotes
  deleteDoc(doc(db, 'users', userId, 'upvotedVariants', variantId))
}


// TODO: Add pagination
export async function getVariantList(order: 'newest' | 'upvotes'): Promise<[VariantDoc, string][]> {
  const orderQuery = order === 'newest' ?
    orderBy('creationTime', 'desc') :
    orderBy('numUpvotes', 'desc')
  const q = query(collection(db, 'variants'), orderQuery)
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => [doc.data() as VariantDoc, doc.id])
}

// Returns the variants created by the user, in order of creation time
export async function getVariantsFromCreator(userId: string): Promise<[VariantDoc, string][]> {
  const q = query(collection(db, 'variants'), where('creatorId', '==', userId), orderBy('creationTime', 'desc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => [doc.data() as VariantDoc, doc.id])
}

// Returns the upvoted variants for the user, in order of upvote time
export async function getUpvotedVariants(userId: string): Promise<[VariantDoc, string][]> {
  // Get upvoted variants
  const q = query(collection(db, 'users', userId, 'upvotedVariants'), orderBy('timeUpvoted', 'desc'))
  const querySnapshot = await getDocs(q)
  const variantIds = querySnapshot.docs.map(doc => doc.id)
  // For each variant, get the variant document
  const variantDocs = await Promise.all(variantIds.map(id => {
    const variant = getVariantById(id)
    if (!variant) throw new Error(`Upvoted variant ${id} does not exist`)
    return variant
  }))
  // Return the variant document and the variant ID
  return variantDocs.map((doc, i) => [doc as VariantDoc, variantIds[i]])
}
