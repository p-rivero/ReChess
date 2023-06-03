
import { makeSummaryLine } from '../../moderator/helpers/report-utils'
import { updatePrivateCache } from './update-private-cache'
import { useAdmin } from '../../helpers'
import type { DocumentReference } from 'firebase-admin/firestore'
import type { ModerationDoc } from 'db/schema'

export type ReportType = 'variant' | 'user'

/**
 * Increments the report count of a variant or user, and updates
 * the private cache of the user that made the report.
 * @param {ReportType} mode Whether to report a variant or a user
 * @param {string} docId UID of the variant or user that was reported
 * @param {string} reporterId UID of the user who reported the variant or user
 * @param {string} reportReason User-provided reason for the report. Can be empty.
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function incrementReports(mode: ReportType, docId: string, reporterId: string, reportReason: string) {
  const { db } = await useAdmin()
  const collection = mode === 'user' ? 'userModeration' : 'variantModeration'
  const moderationRef = db.collection(collection).doc(docId)
  
  const cacheOperation = mode === 'user' ? 'reportUser' : 'reportVariant'
  
  await Promise.all([
    appendReport(moderationRef, reporterId, reportReason),
    updatePrivateCache(cacheOperation, reporterId, docId),
  ])
}

async function appendReport(moderationRef: DocumentReference, reporterId: string, reportReason: string) {
  const { db } = await useAdmin()
  const newSummaryLine = await makeSummaryLine(reporterId, reportReason)
  
  try {
    await db.runTransaction(async (transaction) => {
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
    })
  } catch (err) {
    console.error(`Error while appending report to ${moderationRef.path}`)
    console.error(err)
  }
}
