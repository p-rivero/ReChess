
import { HttpsError } from 'firebase-functions/v1/https'
import { parseSummaryLine } from './report-utils'
import { useAdmin } from '../../helpers'
import type { ModerationDoc } from 'db/schema'

/**
 * Removes one or more reports of a variant or user, given the usernames of the reporters.
 * If a reporter is not found, it's ignored (the function is idempotent).
 * @param {string[]} reporters For each report to remove, the username of the reporter
 * @param {FirebaseFirestore.DocumentReference} docRef Reference to a `ModerationDoc` to update
 * @return {Promise<void>} A promise that resolves when the reports have been removed
 * @throws An HTTP error is returned if there is no variant with the given ID
 */
export async function discardReports(reporters: unknown, docRef: FirebaseFirestore.DocumentReference) {
  if (!Array.isArray(reporters) || reporters.some((index) => typeof index !== 'string')) {
    throw new HttpsError('invalid-argument', 'The reporters must be a list of strings.')
  }
  
  const { db } = await useAdmin()
  
  await db.runTransaction(async (transaction) => {
    // Get the moderation document
    const modSnap = await transaction.get(docRef)
    if (!modSnap.exists) {
      throw new HttpsError('not-found', 'This moderation document does not exist.')
    }
    const modDoc = modSnap.data() as ModerationDoc
    
    // Filter reports from the moderation document
    const reports = modDoc.reportsSummary.split('\n').filter((line) => line.length > 0)
    const newReports = reports.filter((r) => !reporters.includes(parseSummaryLine(r).reporter))
    const newReportsSummary = newReports.join('\n')
    
    // Update the document
    // TODO: If newReports is empty, delete the document
    transaction.set(docRef, {
      numReports: newReports.length,
      reportsSummary: newReportsSummary,
    })
  })
}
