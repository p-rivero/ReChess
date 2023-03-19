
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type { UserDoc, UserUpvotesDoc, VariantDoc, VariantUpvotesDoc } from '@/firebase/db/schema'
import { Timestamp } from 'firebase/firestore'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, add, remove, now, startBatch }: TestUtilsSignature = notInitialized()

// setupJest('variant-upvotes-tests', env => {
//   ({ get, query, set, add, remove, now, startBatch } = setupTestUtils(env, MY_ID, MY_EMAIL))
// })
setupJest('rechess-web', env => {
  ({ get, query, set, add, remove, now, startBatch } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


// Things that are NOT validated:

// - When creating a variant, the /upvotes/doc document must also be created. The only issue with this is that the variant cannot be upvoted. Since the variant id is not known until after the variant is created, the client cannot create both documents in a single batch. Therefore, it cannot be validated in the rules.

// - The variant name of the upvote document must be correct (the same as the variant's name). This is only readable by the user who upvoted it, so there is no incentive to lie. Checking this would require an extra read from the variants collection.


async function createUserAndVariant(creatorId: string = 'some_id', addUpvote: boolean = true) {
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
      creatorId: MY_ID,
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
  const batch = startBatch('unverified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot upvote a variant that does not exist', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', 'BAD_ID')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('upvote timestamp must be correct', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: Timestamp.fromDate(new Date(2020, 1, 1)),
    variantName: 'My variant',
  }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 11 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot upvote a variant twice', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
  const batch = startBatch('verified')
  batch.set(upvoteDoc, 'users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 12 }, 'variants', '1234', 'upvotes', 'doc')
  await assertFails(batch.commit())
})

test('cannot remove upvote if not upvoted first', async () => {
  await createUserAndVariant()
  const batch = startBatch('verified')
  batch.remove('users', MY_ID, 'upvotedVariants', '1234')
  batch.set({ numUpvotes: 9 }, 'variants', '1234',
  'upvotes', 'doc')
  await assertFails(batch.commit())
  
  assertFails(
    set('verified', { numUpvotes: 9 }, 'variants', '1234', 'upvotes', 'doc')
  )
})

test('cannot decrement votes by more than 1', async () => {
  await createUserAndVariant()
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
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
  const upvoteDoc: UserUpvotesDoc = {
    timeUpvoted: now(),
    variantName: 'My variant',
  }
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
    query('verified', `users/ANOTHER_ID/upvotedVariants`)
  )
})
