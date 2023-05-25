
import { ModerationDoc, UserDoc } from 'db/schema'
import { updatePrivateCache } from './update-private-cache'
import { useAdmin } from '../../helpers'

/**
 * Increments the report count of a variant or user, and updates
 * the private cache of the user that made the report.
 * @param {'users' | 'variants'} collectionName Whether to report a variant or a user
 * @param {string} docId UID of the variant or user that was reported
 * @param {string} reporterId UID of the user who reported the variant or user
 * @param {string} reportReason User-provided reason for the report. Can be empty.
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function incrementReports(
  collectionName: 'users' | 'variants',
  docId: string,
  reporterId: string,
  reportReason: string
): Promise<void> {
  const { db } = await useAdmin()
  
  const moderationRef = db.collection(collectionName).doc(docId).collection('moderation').doc('doc')
  const newSummaryLine = await makeSummaryLine(reporterId, reportReason)
  const p1 = db.runTransaction(async (transaction) => {
    const moderationSnap = await transaction.get(moderationRef)
    let newDoc: ModerationDoc
    if (moderationSnap.exists) {
      const oldDoc = moderationSnap.data() as ModerationDoc
      newDoc = {
        numReports: oldDoc.numReports + 1,
        reportsSummary: oldDoc.reportsSummary + newSummaryLine,
      }
    } else {
      newDoc = { numReports: 1, reportsSummary: newSummaryLine }
    }
    transaction.set(moderationRef, newDoc)
  }).catch((err) => {
    console.error('Error while incrementing upvotes or reports:', collectionName, docId)
    console.error(err)
  })
  
  const mode = collectionName === 'users' ? 'reportUser' : 'reportVariant'
  const p2 = updatePrivateCache(mode, docId, reporterId)
  
  await Promise.all([p1, p2])
}

/**
 * Returns a line to add to the reports summary of a variant or user.
 * @param {string} userId UID of the user who reported the variant or user
 * @param {string} reportReason Reason for the report
 * @return {string} The text to append to the reports summary. It can be empty,
 * if nothing should be added to the summary.
 */
async function makeSummaryLine(userId: string, reportReason: string): Promise<string> {
  // No reason provided: don't add anything to the summary
  if (!reportReason) return ''
  const username = await getUsername(userId)
  const currentTimestamp = Date.now()
  return `${username}\t${reportReason}\t${currentTimestamp}\n`
}

/**
 * Returns the username of the user with the given ID.
 * @param {string} userId UID of the user
 * @return {string} The username of the user
 */
async function getUsername(userId: string): Promise<string> {
  const { db } = await useAdmin()
  const userSnap = await db.collection('users').doc(userId).get()
  const userDoc = userSnap.data() as UserDoc
  return userDoc.IMMUTABLE.username
}
