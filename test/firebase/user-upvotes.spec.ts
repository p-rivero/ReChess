
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type { UserDoc, UserUpvotesDoc, VariantDoc } from '@/firebase/db/schema'
import { Timestamp } from 'firebase/firestore'

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
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'Another user',
    creatorId,
    numUpvotes: 10,
    initialState: '{}',
  }
  await set('admin', user, 'users', MY_ID)
  await set('admin', variant, 'variants', '1234')
}

test('can upvote and un-upvote a variant', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  await assertSucceeds(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
  await assertSucceeds(
    remove('verified', 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot upvote a variant if not verified', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  await assertFails(
    set('unverified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot upvote a variant that does not exist', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  await assertFails(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', 'BAD_ID')
  )
})

test('upvote timestamp must be correct', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: Timestamp.fromDate(new Date(2020, 1, 1)) }
  await assertFails(
    set('verified', upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  )
})

test('cannot upvote a variant twice', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
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
  assertSucceeds(
    get('verified', 'users', MY_ID, 'upvotedVariants', '1234')
  )
  assertSucceeds(
    query('verified', `users/${MY_ID}/upvotedVariants`)
  )
})

test('cannot see upvotes of another user', async () => {
  await createUserAndVariant('ANOTHER_ID')
  assertFails(
    get('verified', 'users', 'ANOTHER_ID', 'upvotedVariants', '1234')
  )
  assertFails(
    query('verified', 'users/ANOTHER_ID/upvotedVariants')
  )
})
