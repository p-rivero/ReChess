import { fetchUserDoc } from '../../user/helpers/fetch-user'
import { useAdmin } from '../../helpers'
import type { BannedUserDataDoc, ReportDoc } from 'db/schema'

/**
 * Returns a line to add to the reports summary of a variant or user.
 * @param {string} userId UID of the user who reported the variant or user
 * @param {ReportDoc} report The report to add to the summary
 * @return {string} The text to append to the reports summary.
 */
export async function makeSummaryLine(userId: string, report: ReportDoc): Promise<string> {
  let reportReason = report.reason.trim()
  // Ignore reports that contain \n or \t
  if (/[\n\t]/.exec(reportReason)) {
    console.warn('Ignoring report invalid characters:', reportReason, userId)
    reportReason = '[INVALID CHARACTERS DETECTED]'
  }
  if (reportReason.length === 0) {
    reportReason = '-'
  }
  const userDoc = await fetchUserDoc(userId)
  if (!userDoc) {
    throw new Error(`Attempting to add a report for a user that does not exist: ${userId}`)
  }
  const username = userDoc.IMMUTABLE.username
  const timestamp = report.time.toMillis()
  return `${username}\t${reportReason}\t${timestamp}\n`
}

/**
 * Returns the fields encoded in a line of a reports summary.
 * @param {string} line A line of a reports summary
 * @return {Object} An object with the fields `reporter`, `reason`, and `timestamp`.
 * `reporter` is the username of the user who reported the variant or user.
 * @throws An error is thrown if the line is not formatted correctly
 */
export function parseSummaryLine(line: string): { reporter: string, reason: string, timestamp: number } {
  const [reporter, reason, timestamp] = line.split('\t')
  return { reporter, reason, timestamp: parseInt(timestamp) }
}


/**
 * Retrieves the stored backup of a user's data, if it exists.
 * @param {string} userId UID of the user whose data should be retrieved
 * @return {Promise<BannedUserDataDoc | undefined>} A promise that resolves with the user's data
 */
export async function fetchDataBackup(userId: string): Promise<BannedUserDataDoc | undefined> {
  const { db } = await useAdmin()
  const snapshot = await db.collection('bannedUserData').doc(userId).get()
  return snapshot.data() as BannedUserDataDoc | undefined
}

/**
 * Clears the stored backup of a user's data. If the user is still banned it's impossible
 * to restore the user's data after this function is called.
 * @param {string} userId UID of the user whose data should be cleared
 * @return {Promise<void>} A promise that resolves when the function is complete
 */
export async function removeDataBackup(userId: string): Promise<void> {
  const { db } = await useAdmin()
  await db.collection('bannedUserData').doc(userId).delete()
}
