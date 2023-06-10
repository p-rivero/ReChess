
import { useAdmin } from '../helpers'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { VariantDoc, VariantIndexDoc } from 'db/schema'

/**
 * 1 MiB - 89 bytes.
 * @see https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields
 */
const MAX_INDEX_SIZE = 1_048_487

/**
 * Called when a variant document is inserted. Appends the variant to the index.
 * @param {Change<QueryDocumentSnapshot>} snap Snapshot of the document that was inserted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(snap: QueryDocumentSnapshot): Promise<void> {
  let { name, description, tags } = snap.data() as VariantDoc
  
  // Enforce the 35 character limit on tags and remove invalid characters
  if (tags.some((tag) => tag.length > 35)) {
    await deleteVariant(snap)
    return
  }
  tags = tags.map((tag) => tag.replace(/[\t\n# ,]/g, '').toLowerCase())
  
  // Replace tabs and newlines with spaces
  name = name.replace(/[\t\n]/g, ' ').toLowerCase()
  description = description.replace(/[\t\n]/g, ' ').toLowerCase()
  
  const line = `${snap.id}\t${name}\t${description.slice(0, 100)}\t${tags.join(',')}`
  
  // Append the variant to the first index that has space
  let index = 0
  let success = false
  while (!success) {
    success = await appendLineToIndex(line, index)
    index++
  }
}


async function appendLineToIndex(line: string, indexNum: number): Promise<boolean> {
  const { db } = await useAdmin()
  const indexRef = db.collection('variantIndex').doc(indexNum.toString())
  const indexDoc = await indexRef.get()
  
  if (!indexDoc.exists) {
    // Create the index with the new line
    await indexRef.set({ index: line })
    return true
  }
  const indexData = indexDoc.data() as VariantIndexDoc
  const oldIndex = indexData.index
  if (oldIndex.length + 1 + line.length > MAX_INDEX_SIZE) { // +1 for '\n'
    // The index is full, try the next one
    return false
  }
  // Append the new line to the existing index
  await indexRef.set({ index: oldIndex + '\n' + line })
  return true
}

async function deleteVariant(variantSnap: QueryDocumentSnapshot) {
  const { creatorId } = variantSnap.data() as VariantDoc
  console.warn(`Deleting variant with invalid tags. creatorId: ${creatorId}`)
  try {
    await variantSnap.ref.delete()
  } catch (err) {
    console.error('Cannot delete invalid variant', err)
  }
}
