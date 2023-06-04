
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from './utils'
import { setupJest } from './init'

import { Timestamp } from 'firebase/firestore'
import type { ReportDoc, UserDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'
const VARIANT_ID = 'some_variant_id'

let { get, query, set, remove, now }: TestUtilsSignature = notInitialized()

setupJest('report-tests', env => {
  ({ get, query, set, remove, now } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function createUser(username = 'my_username', id = MY_ID) {
  const user: UserDoc = {
    name: 'Some user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username,
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  await set('admin', user, 'users', id)
}
async function createVariant(id: string) {
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'Another user',
    creatorId: 'some_id',
    numUpvotes: 10,
    popularity: 2,
    initialState: '{}',
    tags: [],
  }
  await set('admin', variant, 'variants', id)
}

test('can report (but not unreport) a variant', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
  await assertFails(
    remove('verified', 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
})

test('can report (but not unreport) a user', async () => {
  await createUser()
  await createUser('bad_person', 'bad_person_id')
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  await assertFails(
    remove('verified', 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('can block (but not unblock) a user', async () => {
  await createUser()
  await createUser('bad_person', 'bad_person_id')
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: true,
    reason: '',
  }
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  await assertFails(
    remove('verified', 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('can report a variant without reason', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: '',
  }
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
})

test('cannot report a variant if not verified', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertFails(
    set('unverified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
})

test('cannot report a user if not verified', async () => {
  await createUser()
  await createUser('bad_person', 'bad_person_id')
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertFails(
    set('unverified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('cannot report a variant that does not exist', async () => {
  await createUser()
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', 'BAD_ID')
  )
})

test('cannot report a user that does not exist', async () => {
  await createUser()
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'BAD_ID')
  )
})

test('users cannot report themselves', async () => {
  await createUser()
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', MY_ID)
  )
})

test('report timestamp must be correct', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  await createUser('bad_person', 'bad_person_id')
  
  const reportDoc: ReportDoc = {
    time: Timestamp.fromDate(new Date(2020, 1, 1)),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('cannot report a variant twice', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
})

test('cannot report a user twice', async () => {
  await createUser()
  await createUser('bad_person', 'bad_person_id')
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('cannot report a user after blocking them', async () => {
  await createUser()
  await createUser('bad_person', 'bad_person_id')
  
  const blockDoc: ReportDoc = {
    time: now(),
    onlyBlock: true,
    reason: '',
  }
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'Some reason',
  }
  await assertSucceeds(
    set('verified', blockDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('max reason length is 1000', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: false,
    reason: 'a'.repeat(251),
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
  reportDoc.reason = 'a'.repeat(250)
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
})



test('cannot add a reason when blocking a user', async () => {
  await createUser()
  await createUser('bad_person', 'bad_person_id')
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: true,
    reason: 'Some reason',
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  reportDoc.reason = ''
  await assertSucceeds(
    set('verified', reportDoc, 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
})

test('cannot block a variant', async () => {
  await createUser()
  await createVariant(VARIANT_ID)
  
  const reportDoc: ReportDoc = {
    time: now(),
    onlyBlock: true,
    reason: '',
  }
  await assertFails(
    set('verified', reportDoc, 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
})



test('can see own reports', async () => {
  await createUser()
  
  await assertSucceeds(
    get('verified', 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
  await assertSucceeds(
    get('verified', 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  await assertSucceeds(
    query('verified', `users/${MY_ID}/reportedVariants`)
  )
  await assertSucceeds(
    query('verified', `users/${MY_ID}/reportedUsers`)
  )
})

test('cannot see reports of another user', async () => {
  await createUser()
  
  await assertFails(
    get('unverified', 'users', MY_ID, 'reportedVariants', VARIANT_ID)
  )
  await assertFails(
    get('unverified', 'users', MY_ID, 'reportedUsers', 'bad_person_id')
  )
  await assertFails(
    query('unverified', `users/${MY_ID}/reportedVariants`)
  )
  await assertFails(
    query('unverified', `users/${MY_ID}/reportedUsers`)
  )
})
