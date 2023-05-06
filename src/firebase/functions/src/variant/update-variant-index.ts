
import { useAdmin } from '../helpers'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { VariantDoc, VariantIndexDoc } from 'db/schema'

/**
 * Called when a variant document is inserted. Appends the variant to the index.
 * @param {Change<QueryDocumentSnapshot>} snap Snapshot of the document that was inserted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(snap: QueryDocumentSnapshot): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  let { name, description, tags } = snap.data() as VariantDoc
  
  // Enforce the 35 character limit on tags
  if (tags.some(tag => tag.length > 35)) {
    snap.ref.delete().catch((e) => console.error('Cannot delete invalid variant', e))
    return
  }
  
  // Replace tabs and newlines with spaces
  name = name.replace(/[\t\n]/g, ' ').toLowerCase()
  description = description.replace(/[\t\n]/g, ' ').toLowerCase()
  tags = tags.map(tag => tag.replace(/[\t\n# ,]/g, '').toLowerCase())
  
  const line = `${snap.id}\t${name}\t${description.slice(0, 100)}\t${tags.join(',')}`
  
  const indexRef = db.collection('variantIndex').doc('doc')
  const indexDoc = await indexRef.get()
  
  if (indexDoc.exists) {
    // Append the new line to the existing index
    const indexData = indexDoc.data() as VariantIndexDoc
    const oldIndex = indexData.index
    await indexRef.set({
      index: oldIndex + '\n' + line,
    })
  } else {
    // Create the index with the new line
    await indexRef.set({
      index: line,
    })
  }
}
