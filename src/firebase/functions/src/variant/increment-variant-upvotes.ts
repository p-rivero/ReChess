
import { FieldValue } from 'firebase-admin/firestore'
import { UserPrivateCacheDoc } from 'db/schema'
import { useAdmin } from '../helpers'

/**
 * Called when a a user upvotes a variant. Increment the upvote count for the variant.
 * @param {string} variantId UID of the variant that was upvoted
 * @param {string} userId UID of the user who un-upvoted the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string, userId: string): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  // Increment the upvote count for the variant
  db.collection('variants')
    .doc(variantId)
    .update('numUpvotes', FieldValue.increment(1))
    .catch((err) => {
      console.error('Error while incrementing variant upvotes for variant', variantId + ':')
      console.error(err)
    })
    
  // Fetch the user private cache
  const userCacheRef = db.collection('users').doc(userId).collection('privateCache').doc('doc')
  const userCacheSnapshot = await userCacheRef.get()
  let userCacheDoc = userCacheSnapshot.data() as UserPrivateCacheDoc | undefined
  
  if (!userCacheDoc) {
    userCacheDoc = {
      upvotedVariants: variantId,
      reportedVariants: '',
      reportedUsers: '',
    }
  } else {
    userCacheDoc.upvotedVariants += ' ' + variantId
  }
  userCacheRef.set(userCacheDoc)
    .catch((err) => {
      console.error('Error while updating cache for user', userId + ':')
      console.error(err)
    })
}
