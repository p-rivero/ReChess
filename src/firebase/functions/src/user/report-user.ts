
import { ReportDoc } from 'db/schema'
import { incrementReports } from './helpers/increment-reports'
import { updatePrivateCache } from './helpers/update-private-cache'

/**
 * Called when a user reports or blocks another user. Updates the private cache of the
 * reporter/blocker, and if it's a report (not a block), increments the report count of the
 * reported user.
 * @param {string} reportedId UID of the user that was reported or blocked
 * @param {string} reporterId UID of the user who reported or blocked the other user
 * @param {QueryDocumentSnapshot} snap Snapshot of the document that was created by the reporter
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(reportedId: string, reporterId: string, snap: FirebaseFirestore.QueryDocumentSnapshot) {
  const report = snap.data() as ReportDoc
  if (report.onlyBlock) {
    await updatePrivateCache('reportUser', reporterId, reportedId)
  } else {
    // This increments the report count of the reported user and then calls updatePrivateCache
    await incrementReports('user', reportedId, reporterId, report.reason)
  }
}
