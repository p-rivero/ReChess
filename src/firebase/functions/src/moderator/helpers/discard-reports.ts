
import { HttpsError } from 'firebase-functions/v1/https'
import { ModerationDoc } from 'db/schema'

/**
 * Removes one or more reports of a variant or user.
 * @param {number[]} reportIndexes List of 0-based indexes of the reports to discard (positive integers).
 * Duplicate indexes are ignored.
 * The function admits an `unknown` type and validates the input.
 * @param {FirebaseFirestore.DocumentReference} docRef Reference to a `ModerationDoc` to update
 * @return {Promise<void>} A promise that resolves when the reports have been removed
 * @throws An HTTP error is returned if some of the following errors occur:
 * - There is no variant with the given ID
 * - An element of `reportIndexes` is out of range (`>= variant.reports.length`)
 */
export async function discardReports(reportIndexes: unknown, docRef: FirebaseFirestore.DocumentReference) {
  if (!Array.isArray(reportIndexes) || reportIndexes.some((index) => typeof index !== 'number')) {
    throw new HttpsError('invalid-argument', 'The reportIndexes must be a list of numbers.')
  }
  if (reportIndexes.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new HttpsError('invalid-argument', 'All indexes must be a positive integer.')
  }
  const indexes = new Set(reportIndexes as number[])
  
  // The code below should be in a transaction to avoid lost updates, but
  // then we would need to rewrite it to be idempotent (otherwise, more
  // reports would be discarded than intended).
  // Running it without a transaction is not a problem because:
  // - The function is only called by the moderator
  // - It's not called very often
  // - If a lost update occurs, no data is lost (some reports are not discarded and
  //   the moderator can try again).
  
  const modSnap = await docRef.get()
  if (!modSnap.exists) {
    throw new HttpsError('not-found', 'This moderation document does not exist.')
  }
  const modDoc = modSnap.data() as ModerationDoc
  // Get the reports from the moderation document
  const reports = modDoc.reportsSummary.split('\n').filter((line) => line.length > 0)
  
  if (reportIndexes.some((index) => index >= reports.length)) {
    throw new HttpsError('invalid-argument', 'Some of the given indexes are out of range.')
  }
  
  // Remove the reports at the given indexes
  const newReports = reports.filter((_, index) => !indexes.has(index))
  const newReportsSummary = newReports.join('\n')
  // Update the document
  console.log('Discarding reports: ' + reportIndexes.join(', ') + ' result: ' + newReports.length + ', ' + newReportsSummary)
  await docRef.update({
    numReports: newReports.length,
    reportsSummary: newReportsSummary,
  })
}
