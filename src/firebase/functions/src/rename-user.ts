
import { Timestamp } from 'firebase-admin/firestore'
import type { Change, EventContext } from 'firebase-functions'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

import { useAdmin } from './helpers'
import type { UserDoc } from 'db/schema'

type Params = {
  userId: string
}

/**
 * When a user is renamed, update the timeout
 * @param {Change<QueryDocumentSnapshot>} change The change object
 * @param {EventContext<Params>} context The event context
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function renameUser(
  change: Change<QueryDocumentSnapshot>,
  context: EventContext<Params>
): Promise<void> {
  const TIMEOUT_SECONDS = 3600 * 24 // 1 day
  
  const admin = await useAdmin()
  const db = admin.firestore()
  
  const { userId } = context.params
  const before = change.before.data() as UserDoc
  const after = change.after.data() as UserDoc
  // When the user is updated, check if the name has changed
  if (before.name === after.name) return
  
  // If this write was allowed by the rules, the current timestamp must be after the renameAllowedAt
  const name = after.name
  
  // TODO
  console.log(`User ${userId} renamed to ${name}`)
  
  // Update the timeout
  const timeout = Date.now() + 1000 * TIMEOUT_SECONDS
  const timeoutDate = new Date(timeout)
  const timeoutTimestamp = Timestamp.fromDate(timeoutDate)
  db.collection('users').doc(userId).update({ renameAllowedAt: timeoutTimestamp })
}
