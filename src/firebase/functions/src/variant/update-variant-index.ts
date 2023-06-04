
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
  
  // Enforce the 35 character limit on tags
  if (tags.some((tag) => tag.length > 35)) {
    snap.ref.delete().catch((e) => console.error('Cannot delete invalid variant', e))
    return
  }
  
  // Replace tabs and newlines with spaces
  name = name.replace(/[\t\n]/g, ' ').toLowerCase()
  description = description.replace(/[\t\n]/g, ' ').toLowerCase()
  tags = tags.map((tag) => tag.replace(/[\t\n# ,]/g, '').toLowerCase())
  
  const line = `${snap.id}\t${name}\t${description.slice(0, 100)}\t${tags.join(',')}`
  
  // Append the variant to the first index that has space
  let index = 0
  let success = false
  while (!success) {
    success = await appendToIndex(line, index)
    index++
  }
}


/**
 * Appends a line to the a given index document.
 * @param {string} line Text to append to the index
 * @param {number} index Number of the index document to append to, incremented until a free index is found
 * @return {Promise<boolean>} True if the line was appended, false if the index is full
 */
async function appendToIndex(line: string, index: number): Promise<boolean> {
  const { db } = await useAdmin()
  const indexRef = db.collection('variantIndex').doc(index.toString())
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
