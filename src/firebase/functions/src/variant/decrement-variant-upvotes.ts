
import { FieldValue } from 'firebase-admin/firestore'
import { UserPrivateCacheDoc } from 'db/schema'
import { useAdmin } from '../helpers'

/**
 * Called when a a user removes their upvote of a variant. Decrement the upvote count for the variant.
 * @param {string} variantId UID of the variant that was un-upvoted
 * @param {string} userId UID of the user who un-upvoted the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string, userId: string): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  
  // Decrement the upvote count for the variant
  db.collection('variants')
    .doc(variantId)
    .update('numUpvotes', FieldValue.increment(-1))
    .catch((err) => {
      console.error('Error while decrementing variant upvotes for variant', variantId + ':')
      console.error(err)
    })
  
  // Fetch the user private cache
  const userCacheRef = db.collection('users').doc(userId).collection('privateCache').doc('doc')
  const userCacheSnapshot = await userCacheRef.get()
  
  // This could happen if the user upvotes and then immediately un-upvotes a variant,
  // and the increment function is slow to update the variant's upvote count.
  // Give the other function some time to write the user's private cache, then clear it.
  if (!userCacheSnapshot.exists) {
    console.error('Creating cache from decrementVariantUpvotes!', userId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newDoc: UserPrivateCacheDoc = {
      upvotedVariants: '',
      reportedVariants: '',
      reportedUsers: '',
    }
    userCacheRef.set(newDoc).catch(console.error)
    return
  }
  
  const userCacheDoc = userCacheSnapshot.data() as UserPrivateCacheDoc
  const upvotedVariants = userCacheDoc.upvotedVariants
    
  // Split the string into chunks, find the variantId, and remove it
  const CHUNK_SIZE = 20
  let splicedVariants: string | undefined = undefined
  for (let i = 0; i < upvotedVariants.length; i += CHUNK_SIZE) {
    const chunk = upvotedVariants.slice(i, i + CHUNK_SIZE)
    if (chunk === variantId) {
      splicedVariants = upvotedVariants.slice(0, i) + upvotedVariants.slice(i + CHUNK_SIZE)
      break
    }
  }
  // This could happen if the user upvotes and then immediately un-upvotes a variant.
  // Give the other function some time to write the user's private cache, then write our version.
  if (splicedVariants === undefined) {
    console.error('Overriding cache!', variantId, upvotedVariants)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    splicedVariants = upvotedVariants
  }
  
  // Update the user private cache
  userCacheRef.update({ upvotedVariants: splicedVariants })
    .catch((err) => {
      console.error('Error while updating cache for user', userId + ':')
      console.error(err)
    })
}
