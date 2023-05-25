
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import assertCallerIsModerator from './assert-caller-is-moderator'

/**
 * Called directly by the moderator when a variant report is not useful.
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that was reported
 * @param {number} data.reportIndex 0-based index of the report to discard (positive integer)
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - There is no variant with the given ID
 * - The variant has less than `reportIndex + 1` reports
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  await assertCallerIsModerator(context)
  
  // Validate input
  const { variantId, reportIndex } = data as { variantId: unknown, reportIndex: unknown }
  if (!variantId || !reportIndex) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId and reportIndex.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  if (typeof reportIndex !== 'number') {
    throw new HttpsError('invalid-argument', 'The reportIndex must be a number.')
  }
  if (reportIndex < 0 || !Number.isInteger(reportIndex)) {
    throw new HttpsError('invalid-argument', 'The reportIndex must be a positive integer.')
  }
  
  
  // TODO
}
