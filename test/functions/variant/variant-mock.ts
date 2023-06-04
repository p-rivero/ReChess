import admin from 'firebase-admin'
import type { VariantDoc, VariantIndexDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'

type DB = admin.firestore.Firestore

export async function insertVariant(
  db: DB,
  variantId: string,
  firstPlayerToMove: 'white' | 'black' | 'invalid-variant' = 'white',
  creatorId = 'creator_id',
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
    description: 'This is the description for the variant',
    creationTime: admin.firestore.Timestamp.now() as Timestamp,
    creatorDisplayName: 'The Creator Name',
    creatorId,
    numUpvotes: 123,
    popularity: 12,
    tags: [],
    initialState,
  }
  await db.collection('variants').doc(variantId).set(doc)
  return doc
}

export type IndexEntry = {
  id: string
  name: string
  description?: string
  tags?: string[]
}
export async function insertIndex(db: DB, entries: IndexEntry[], indexNum = 0): Promise<VariantIndexDoc> {
  const index = entries.map(e => {
    const description = e.description ?? `This is the description for ${e.name}`
    const tags = e.tags ? e.tags.join(',') : 'tag1,tag2'
    return `${e.id}\t${e.name}\t${description}\t${tags}`
  }).join('\n')
  const doc: VariantIndexDoc = { index }
  await db.collection('variantIndex').doc(indexNum.toString()).set(doc)
  return doc
}
