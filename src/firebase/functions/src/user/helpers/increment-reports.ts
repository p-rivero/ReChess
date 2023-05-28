
import { ModerationDoc } from 'db/schema'
import { makeSummaryLine } from '../../moderator/helpers/report-utils'
import { updatePrivateCache } from './update-private-cache'
import { useAdmin } from '../../helpers'

/**
 * Increments the report count of a variant or user, and updates
 * the private cache of the user that made the report.
 * @param {'users' | 'variants'} mode Whether to report a variant or a user
 * @param {string} docId UID of the variant or user that was reported
 * @param {string} reporterId UID of the user who reported the variant or user
 * @param {string} reportReason User-provided reason for the report. Can be empty.
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function incrementReports(
  mode: 'users' | 'variants',
  docId: string,
  reporterId: string,
  reportReason: string
): Promise<void> {
  const { db } = await useAdmin()
  
  const collection = mode === 'users' ? 'userModeration' : 'variantModeration'
  const moderationRef = db.collection(collection).doc(docId)
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
    console.error('Error while incrementing upvotes or reports:', mode, docId)
    console.error(err)
  })
  
  const cacheOperation = mode === 'users' ? 'reportUser' : 'reportVariant'
  const p2 = updatePrivateCache(cacheOperation, docId, reporterId)
  
  await Promise.all([p1, p2])
}
