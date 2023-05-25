
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import assertCallerIsModerator from './assert-caller-is-moderator'

/**
 * Called directly by the moderator when a variant report is not useful.
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that was reported
 * @param {number[]} data.reportIndexes List of 0-based indexes of the reports to discard (positive integers).
 * Duplicate indexes are ignored.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - There is no variant with the given ID
 * - An element of `reportIndexes` is `>= user.reports.length`
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  await assertCallerIsModerator(context)
  
  // Validate input
  const { variantId, reportIndexes } = data as { variantId: unknown, reportIndexes: unknown }
  if (!variantId || !reportIndexes) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId and reportIndexes.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  if (!Array.isArray(reportIndexes) || reportIndexes.some(index => typeof index !== 'number')) {
    throw new HttpsError('invalid-argument', 'The reportIndexes must be a list of numbers.')
  }
  if (reportIndexes.some(index => index < 0 || !Number.isInteger(index))) {
    throw new HttpsError('invalid-argument', 'All indexes must be a positive integer.')
  }
  // const idexes = new Set(reportIndexes as number[])
  
  
  // TODO
}
