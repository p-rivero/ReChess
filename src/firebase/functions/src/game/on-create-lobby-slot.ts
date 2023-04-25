
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Called when a lobby slot document is inserted. Updates the variant popularity (+3 points).
 * @param {Change<QueryDocumentSnapshot>} snap Snapshot of the document that was inserted
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(snap: QueryDocumentSnapshot): Promise<void> {
  const lobbyCollection = snap.ref.parent
  const variantRef = lobbyCollection.parent
  if (variantRef === null) {
    console.error('Variant ref is null', snap.ref.path)
    return
  }
  
  variantRef.update({ popularity: FieldValue.increment(3) })
    .catch((e) => console.error('Cannot update variant popularity', variantRef.id, e))
}
