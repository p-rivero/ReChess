
import { useAdmin } from './helpers'
import type { VariantDoc, VariantIndexDoc } from 'db/schema'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

/**
 * Called when a variant document is inserted. Appends the variant to the index.
 * @param {Change<QueryDocumentSnapshot>} snap Snapshot of the document that was inserted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function updateVariantIndex(
  snap: QueryDocumentSnapshot,
): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  let {name, description} = snap.data() as VariantDoc
  // Replace tabs and newlines with spaces
  name = name.replace(/[\t\n]/g, ' '),
  description = description.replace(/[\t\n]/g, ' ')
  
  const line = `${snap.id}\t${name}\t${description.slice(0, 100)}`
  
  const indexRef = db.collection('variantIndex').doc('doc')
  const indexDoc = await indexRef.get()
  
  if (indexDoc.exists) {
    // Append the new line to the existing index
    const indexData = indexDoc.data() as VariantIndexDoc
    const oldIndex = indexData.index
    await indexRef.set({
      index: oldIndex + '\n' + line
    })
  } else {
    // Create the index with the new line
    await indexRef.set({
      index: line
    })
  }
}
