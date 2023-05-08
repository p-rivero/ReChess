
import { FieldValue } from 'firebase-admin/firestore'
import { UserHiddenDoc, UserPrivateCacheDoc } from 'db/schema'
import { useAdmin } from '../helpers'

/**
 * Called when a a user upvotes or reports a variant or user. Increments the upvote or report count
 * of the variant, or the report count of the user, and updates the user's private cache.
 * @param {'upvoteVariant'|'reportVariant'|'reportUser'} mode The action to perform
 * @param {string} variantOrUserId UID of the variant or user that was upvoted or reported
 * @param {string} userId UID of the user who upvoted or reported the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(
  mode: 'upvoteVariant' | 'reportVariant' | 'reportUser',
  variantOrUserId: string,
  userId: string
): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  // Increment the upvote or report count for the variant or user
  const fieldName = mode === 'upvoteVariant' ? 'numUpvotes' : 'numReports'
  const doc = mode === 'reportUser' ?
    db.collection('users').doc(variantOrUserId).collection('hidden').doc('doc') :
    db.collection('variants').doc(variantOrUserId)
    
  // Create the user's hidden doc if it doesn't exist
  if (mode === 'reportUser' && !(await doc.get()).exists) {
    const newDoc: UserHiddenDoc = { numReports: 0 }
    await doc.set(newDoc)
  }
  
  doc.update(fieldName, FieldValue.increment(1)).catch((err) => {
    console.error('Error while incrementing upvotes or reports:', mode, variantOrUserId, userId)
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
  if (mode === 'upvoteVariant') {
    userCacheDoc.upvotedVariants += ' ' + variantOrUserId
  } else if (mode === 'reportVariant') {
    userCacheDoc.reportedVariants += ' ' + variantOrUserId
  } else {
    userCacheDoc.reportedUsers += ' ' + variantOrUserId
  }
  
  userCacheRef.set(userCacheDoc)
    .catch((err) => {
      console.error('Error while updating cache for user', userId + ':')
      console.error(err)
    })
}
