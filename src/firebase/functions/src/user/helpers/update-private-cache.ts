
import { UserPrivateCacheDoc } from 'db/schema'
import { useAdmin } from '@/helpers'


/**
 * Updates the private cache of the user that upvoted or reported a variant or user.
 * @param {'upvoteVariant'|'reportVariant'|'reportUser'} mode The action to perform
 * @param {string} variantOrUserId UID of the variant or user that was upvoted or reported
 * @param {string} userId UID of the user who upvoted or reported the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function updatePrivateCache(
  mode: 'upvoteVariant' | 'reportVariant' | 'reportUser',
  variantOrUserId: string,
  userId: string
) {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  // Fetch existing cache doc (if there is one)
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
  // Append the ID to the appropriate field
  switch (mode) {
  case 'upvoteVariant':
    userCacheDoc.upvotedVariants += ' ' + variantOrUserId
    break
  case 'reportVariant':
    userCacheDoc.reportedVariants += ' ' + variantOrUserId
    break
  case 'reportUser':
    userCacheDoc.reportedUsers += ' ' + variantOrUserId
    break
  default:
    throw new Error('Invalid mode: ' + mode)
  }
  
  userCacheRef.set(userCacheDoc)
    .catch((err) => {
      console.error('Error while updating cache for user', userId + ':')
      console.error(err)
    })
}
