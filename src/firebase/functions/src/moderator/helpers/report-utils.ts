import { useAdmin } from '../../helpers'
import type { UserDoc } from 'db/schema'

/**
 * Returns a line to add to the reports summary of a variant or user.
 * @param {string} userId UID of the user who reported the variant or user
 * @param {string} reportReason Reason for the report
 * @return {string} The text to append to the reports summary.
 */
export async function makeSummaryLine(userId: string, reportReason: string): Promise<string> {
  reportReason = reportReason.trim()
  // Ignore reports that contain \n or \t
  if (/[\n\t]/.exec(reportReason)) {
    console.warn('Ignoring report invalid characters:', reportReason, userId)
    reportReason = '[INVALID CHARACTERS DETECTED]'
  }
  if (reportReason.length === 0) {
    reportReason = '-'
  }
  const username = await getUsername(userId)
  const currentTimestamp = Date.now()
  return `${username}\t${reportReason}\t${currentTimestamp}\n`
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

