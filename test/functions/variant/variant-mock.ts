import admin from 'firebase-admin'
import type { VariantDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'

export async function insertVariant(
  db: admin.firestore.Firestore,
  variantId: string,
  firstPlayerToMove: 'white' | 'black' | 'invalid-variant'
): Promise<VariantDoc> {
  let initialState: string
  if (firstPlayerToMove === 'white') {
    initialState = '{"playerToMove":0}'
  } else if (firstPlayerToMove === 'black') {
    initialState = '{"playerToMove":1}'
  } else if (firstPlayerToMove === 'invalid-variant') {
    initialState = '{}'
  } else {
    throw new Error('invalid firstPlayerToMove')
  }
  
  const doc: VariantDoc = {
    name: 'Variant Name',
    description: 'Standard chess rules',
    creationTime: admin.firestore.Timestamp.now() as Timestamp,
    creatorDisplayName: 'test',
    creatorId: null,
    numUpvotes: 123,
    popularity: 12,
    tags: [],
    initialState,
  }
  await db.collection('variants').doc(variantId).set(doc)
  return doc
}
