
import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../helpers'

/**
 * Called when a lobby slot document is inserted. Updates the variant popularity (+3 points).
 * @param {Change<QueryDocumentSnapshot>} variantId ID of the variant for which the lobby slot was created
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string): Promise<void> {
  const { db } = await useAdmin()
  const variantRef = db.collection('variants').doc(variantId)
  
  try {
    await variantRef.update({ popularity: FieldValue.increment(3) })
  } catch (e) {
    console.error('Cannot update variant popularity', variantRef.id, e)
  }
}
