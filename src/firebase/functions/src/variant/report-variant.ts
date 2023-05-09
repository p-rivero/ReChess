
import { ReportDoc } from 'db/schema'
import { incrementReports } from '../user/helpers/increment-reports'

/**
 * Called when a user reports a variant. Increments the report count of the variant and
 * updates the private cache of the user that reported it.
 * @param {string} variantId UID of the variant that was reported
 * @param {string} reporterId UID of the user who reported the variant
 * @param {QueryDocumentSnapshot} snap Snapshot of document that was created by the reporter
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(
  variantId: string,
  reporterId: string,
  snap: FirebaseFirestore.QueryDocumentSnapshot
): Promise<void> {
  const report = snap.data() as ReportDoc
  await incrementReports('variants', variantId, reporterId, report.reason)
}
