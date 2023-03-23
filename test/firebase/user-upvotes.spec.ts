
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type { UserDoc, UserUpvotesDoc, VariantDoc, VariantUpvotesDoc } from '@/firebase/db/schema'
import { Timestamp } from 'firebase/firestore'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, now, startBatch }: TestUtilsSignature = notInitialized()

setupJest('variant-upvotes-tests', env => {
  ({ get, query, set, now, startBatch } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function createUserAndVariant(creatorId = 'some_id', addUpvote = true) {
  const user: UserDoc = {
    name: 'My user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: 'Another user',
      creatorId,
      initialState: '{}',
    },
  }
  await set('admin', user, 'users', MY_ID)
  await set('admin', variant, 'variants', '1234')
  
  if (addUpvote) {
    const upvoteDoc: VariantUpvotesDoc = {
      numUpvotes: 10,
    }
    await set('admin', upvoteDoc, 'variants', '1234', 'upvotes', 'doc')
  }
}

test('can create variant with 0 upvotes', async () => {
  await createUserAndVariant(MY_ID, false)
  const upvoteDoc: VariantUpvotesDoc = {
    numUpvotes: 0,
  }
  await assertSucceeds(
    set('verified', upvoteDoc, 'variants', '1234', 'upvotes', 'doc')
  )
})

test('cannot create variant with more than 0 upvotes', async () => {
  await createUserAndVariant(MY_ID, false)
  const upvoteDoc: VariantUpvotesDoc = {
    numUpvotes: 1,
  }
  await assertFails(
    set('verified', upvoteDoc, 'variants', '1234', 'upvotes', 'doc')
  )
})

test('can upvote and un-upvote a variant', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertSucceeds(batch.commit())
  
  const batch2 = startBatch('verified')
  batch2.remove('users', MY_ID, 'upvotedVariants', '1234')
  batch2.set({ numUpvotes: 10 }, 'variants', '1234', 'upvotes', 'doc')
  await assertSucceeds(batch2.commit())
})

test('cannot upvote a variant if not verified', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('unverified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot upvote a variant that does not exist', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', 'BAD_ID')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('upvote timestamp must be correct', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: Timestamp.fromDate(new Date(2020, 1, 1)) }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot upvote a variant twice', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertSucceeds(batch.commit())
  
  const batch2 = startBatch('verified')
  batch2.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch2.set({ numUpvotes: 12 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch2.commit())
  
  assertFails(
    set('verified', { numUpvotes: 12 }, 'variants', '1234', 'upvotes', 'doc')
  )
})

test('can only increment votes by 1', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 12 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot remove upvote if not upvoted first', async () => {
  await createUserAndVariant()
  const batch = startBatch('verified')
  batch.remove('users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 9 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
  
  assertFails(
    set('verified', { numUpvotes: 9 }, 'variants', '1234', 'upvotes', 'doc')
  )
})

test('cannot decrement votes by more than 1', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertSucceeds(batch.commit())
  
  const batch2 = startBatch('verified')
  batch2.remove('users', MY_ID, 'upvotedVariants', '1234')
  batch2.set({ numUpvotes: 9 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch2.commit())
})

test('cannot upvote a variant without also incrementing numUpvotes', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  await assertFails(batch.commit())
})

test('cannot increment numUpvotes without also upvoting', async () => {
  await createUserAndVariant()
  const batch = startBatch('verified')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot remove upvote without also decrementing numUpvotes', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertSucceeds(batch.commit())
  
  const batch2 = startBatch('verified')
  batch2.remove('users', MY_ID, 'upvotedVariants', '1234')
  await assertFails(batch2.commit())
})

test('cannot decrement numUpvotes without also removing upvote', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = { timeUpvoted: now() }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertSucceeds(batch.commit())
  
  const batch2 = startBatch('verified')
  batch2.set({ numUpvotes: 9 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch2.commit())
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
