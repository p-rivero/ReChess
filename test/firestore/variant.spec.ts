
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from './utils'
import { setupJest } from './init'

import type { UserDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, update, add, remove, now, afterSeconds }: TestUtilsSignature = notInitialized()

setupJest('variant-tests', env => {
  ({ get, query, set, update, add, remove, now, afterSeconds } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function setupUser(name: string | null = 'My name') {
  const user: UserDoc = {
    name,
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
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
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
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
    creationTime: now(),
    creatorDisplayName: '@my_username',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
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
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
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
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
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
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: 'WRONG_ID', // Trying to impersonate another user
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.creatorId = MY_ID
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('creator must id must mot be null', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: null,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
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
    creationTime: now(),
    creatorDisplayName: 'ANOTHER NAME',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  
  // Remove the user's name
  await setupUser(null)
  
  variant.creatorDisplayName = '@wrong_username'
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.creatorDisplayName = '@my_username'
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('creation time must be correct', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: afterSeconds(100),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.creationTime = now()
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('num upvotes must be 0', async () => {
  await setupUser()
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 10,
    popularity: 0,
    tags: [],
    initialState: '{}',
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.numUpvotes = 0
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('popularity must be 0', async () => {
  await setupUser()
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 2,
    tags: [],
    initialState: '{}',
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  variant.popularity = 0
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('cannot edit variant', async () => {
  await setupUser()
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
  }
  await set('admin', variant, 'variants', 'variant_id')
  
  await assertFails(
    update('verified', { name: 'New name' }, 'variants', 'variant_id')
  )
  await assertFails(
    update('verified', { description: 'New description' }, 'variants', 'variant_id')
  )
})

test('cannot remove variant', async () => {
  await setupUser()
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
    initialState: '{}',
  }
  await set('admin', variant, 'variants', 'variant_id')
  
  await assertFails(
    remove('verified', 'variants', 'variant_id')
  )
})


test('can create variant with with tags', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: ['abc', 'def'],
    initialState: '{}',
  }
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('can create variant with with tags', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: ['abc', 'def'],
    initialState: '{}',
  }
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('cannot have more than 7 tags', async () => {
  await setupUser()
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'My name',
    creatorId: MY_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: ['1', '2', '3', '4', '5', '6', '7', '8'],
    initialState: '{}',
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  
  variant.tags.pop()
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
  
  // The 35 char length limit of the tags is not enforced by the security rules
  // The cloud function checks this instead
})
