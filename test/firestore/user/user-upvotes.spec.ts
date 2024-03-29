
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from '../utils'
import { setupJest } from '../init'

import { Timestamp } from 'firebase/firestore'
import type { TimestampDoc, UserDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, remove, now }: TestUtilsSignature = notInitialized()

setupJest('variant-upvotes-tests', env => {
  ({ get, query, set, remove, now } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function createUserAndVariant(creatorId = 'some_id') {
  const user: UserDoc = {
    name: 'My user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
      lastGamesOpponentIds: [],
      lastGamesVariantIds: [],
    },
  }
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'Another user',
    creatorId,
    numUpvotes: 10,
    popularity: 2,
    initialState: '{}',
    tags: [],
  }
  await set('admin', user, 'users', MY_ID)
  await set('admin', variant, 'variants', '1234')
}

test('can upvote and un-upvote a variant', async () => {
  await createUserAndVariant()
  const upvoteDoc: TimestampDoc = { time: now() }
  await assertSucceeds(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
  await assertSucceeds(
    remove('verified', 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot upvote a variant if not verified', async () => {
  await createUserAndVariant()
  const upvoteDoc: TimestampDoc = { time: now() }
  await assertFails(
    set('unverified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot upvote a variant that does not exist', async () => {
  await createUserAndVariant()
  const upvoteDoc: TimestampDoc = { time: now() }
  await assertFails(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', 'BAD_ID')
  )
})

test('upvote timestamp must be correct', async () => {
  await createUserAndVariant()
  const upvoteDoc: TimestampDoc = { time: Timestamp.fromDate(new Date(2020, 1, 1)) }
  await assertFails(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot upvote a variant twice', async () => {
  await createUserAndVariant()
  const upvoteDoc: TimestampDoc = { time: now() }
  await assertSucceeds(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
  await assertFails(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot remove upvote if not upvoted first', async () => {
  await createUserAndVariant()
  await assertFails(
    remove('verified', 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('can see own upvotes', async () => {
  await createUserAndVariant(MY_ID)
  await assertSucceeds(
    get('verified', 'users', MY_ID, 'upvotedVariants', '1234')
  )
  await assertSucceeds(
    query('verified', `users/${MY_ID}/upvotedVariants`)
  )
})

test('cannot see upvotes of another user', async () => {
  await createUserAndVariant('ANOTHER_ID')
  await assertFails(
    get('verified', 'users', 'ANOTHER_ID', 'upvotedVariants', '1234')
  )
  await assertFails(
    query('verified', 'users/ANOTHER_ID/upvotedVariants')
  )
})
