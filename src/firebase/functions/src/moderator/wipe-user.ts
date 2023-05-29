
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { useAdmin } from '../helpers'
import assertModerator from './helpers/assert-moderator'
import banUser from './ban-user'
import deleteVariant from './delete-variant'
import discardUserReports from './discard-user-reports'
import discardVariantReports from './discard-variant-reports'

/**
 * Called directly by the moderator in order to wipe a user's content.
 * If the user is already banned, this function will still wipe their content (if it exists) and return successfully.
 *
 * This does the following:
 * - Removes all of the user's variants
 * - Removes all of the user's reports
 * - Bans the user (see `ban-user.ts`)
 *
 * The user's upvotes are NOT removed.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that the moderator wishes to wipe
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The user to be wiped does not exist
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { userId } = data as { userId: unknown }
  if (!userId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a userId.')
  }
  if (typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'The userId must be a string.')
  }
  
  // Important: Get the variants before banning the user (banUser would remove the userId)
  const { db } = await useAdmin()
  const variants = await db.collection('variants').where('creatorId', '==', userId).get()
  const variantIds = variants.docs.map((doc) => doc.id)
  
  // Start by banning the user, since this has the potential to fail
  await banUser({ userId }, context)
  
  // Remove the user's variants
  await Promise.all(variantIds.map(async (id) => await deleteVariant({ variantId: id }, context)))
  
  // Remove the user's reports
  const reportedVariants = await db.collection('users').doc(userId).collection('reportedVariants').get()
  const reportedVariantIds = reportedVariants.docs.map((doc) => doc.id)
  await Promise.all(reportedVariantIds.map(async (id) => {
    await discardVariantReports({ variantId: id, reporters: [userId] }, context)
  }))
  
  const reportedUsers = await db.collection('users').doc(userId).collection('reportedUsers').get()
  const reportedUserIds = reportedUsers.docs.map((doc) => doc.id)
  await Promise.all(reportedUserIds.map(async (id) => {
    await discardUserReports({ userId: id, reporters: [userId] }, context)
  }))
}
