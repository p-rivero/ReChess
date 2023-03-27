
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type { UserDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, add, remove, now, afterSeconds }: TestUtilsSignature = notInitialized()

setupJest('variant-tests', env => {
  ({ get, query, set, add, remove, now, afterSeconds } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function setupUser(name: string | null = 'My name') {
  const user: UserDoc = {
    name,
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  await set('admin', user, 'users', MY_ID)
}


test('anyone can read created variants', async () => {
  await assertSucceeds(
    get('not logged', 'variants', '1234')
  )
  await assertSucceeds(
    query('not logged', 'variants')
  )
})

test('can create variant with display name', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('can create variant with username', async () => {
  await setupUser(null)
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: '@my_username',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('cannot create variant if not verified', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertFails(
    add('unverified', variant, 'variants')
  )
})

test('variant name must be trimmed', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: '  My variant ',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
})

test('creator id must be correct', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: 'WRONG_ID', // Trying to impersonate another user
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.IMMUTABLE.creatorId = MY_ID
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('creator must id must mot be null', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: null,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  // Creator id can be null if the user has been deleted,
  // but when creating a variant, the user must still exist
  await assertFails(
    add('verified', variant, 'variants')
  )
})

test('creator display name must be correct', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'ANOTHER NAME',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  
  // Remove the user's name
  await setupUser(null)
  
  variant.IMMUTABLE.creatorDisplayName = '@wrong_username'
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.IMMUTABLE.creatorDisplayName = '@my_username'
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('creation time must be correct', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: afterSeconds(100),
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.IMMUTABLE.creationTime = now()
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('num upvotes must be 0', async () => {
  await setupUser()
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      numUpvotes: 10,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.IMMUTABLE.numUpvotes = 0
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('cannot remove variant', async () => {
  await setupUser()
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creationTime: now(),
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      numUpvotes: 0,
      initialState: '{}',
    },
  }
  await set('admin', variant, 'variants', 'variant_id')
  
  await assertFails(
    remove('verified', 'variants', 'variant_id')
  )
})
