
import { FieldValue } from 'firebase-admin/firestore'
import { UserPrivateCacheDoc } from 'db/schema'
import { useAdmin } from '../helpers'

/**
 * Called when a a user upvotes or reports a variant. Increment the upvote count or report count
 * of the variant.
 * @param {'upvote'|'report'} mode Whether to increment the upvote count or report count
 * @param {string} variantId UID of the variant that was upvoted or reported
 * @param {string} userId UID of the user who upvoted or reported the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(mode: 'upvote'|'report', variantId: string, userId: string): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  // Increment the upvote or report count for the variant
  const fieldName = mode === 'upvote' ? 'numUpvotes' : 'numReports'
  db.collection('variants')
    .doc(variantId)
    .update(fieldName, FieldValue.increment(1))
    .catch((err) => {
      console.error('Error while incrementing upvotes or reports for variant', variantId + ':')
      console.error(err)
    })
    
  // Fetch the user private cache
  const userCacheRef = db.collection('users').doc(userId).collection('privateCache').doc('doc')
  const userCacheSnapshot = await userCacheRef.get()
  let userCacheDoc = userCacheSnapshot.data() as UserPrivateCacheDoc | undefined
  
  if (!userCacheDoc) {
    userCacheDoc = {
      upvotedVariants: '',
      reportedVariants: '',
      reportedUsers: '',
    }
  }
  if (mode === 'upvote') {
    userCacheDoc.upvotedVariants += ' ' + variantId
  } else {
    userCacheDoc.reportedVariants += ' ' + variantId
  }
  
  userCacheRef.set(userCacheDoc)
    .catch((err) => {
      console.error('Error while updating cache for user', userId + ':')
      console.error(err)
    })
}
