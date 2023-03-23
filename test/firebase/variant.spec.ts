
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type { UserDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, add, remove }: TestUtilsSignature = notInitialized()

setupJest('variant-tests', env => {
  ({ get, query, set, add, remove } = setupTestUtils(env, MY_ID, MY_EMAIL))
})



test('anyone can read created variants', async () => {
  await assertSucceeds(
    get('not logged', 'variants', '1234')
  )
  await assertSucceeds(
    query('not logged', 'variants')
  )
})

test('can create variant with display name', async () => {
  const user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  await set('admin', user, 'users', MY_ID)
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      initialState: '{}',
    },
  }
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('can create variant with username', async () => {
  const user: UserDoc = {
    name: null,
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  await set('admin', user, 'users', MY_ID)
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: '@my_username',
      creatorId: MY_ID,
      initialState: '{}',
    },
  }
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('cannot create variant if not verified', async () => {
  const user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  await set('admin', user, 'users', MY_ID)
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      initialState: '{}',
    },
  }
  await assertFails(
    add('unverified', variant, 'variants')
  )
})

test('variant name must be trimmed', async () => {
  const user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  await set('admin', user, 'users', MY_ID)
  
  const variant: VariantDoc = {
    name: '  My variant ',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
})

test('creator id must be correct', async () => {
  const user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  await set('admin', user, 'users', MY_ID)
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorId: 'WRONG_ID',
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
})

test('creator display name must be correct', async () => {
  const user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    },
  }
  await set('admin', user, 'users', MY_ID)
  
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    IMMUTABLE: {
      creatorDisplayName: 'ANOTHER NAME',
      creatorId: MY_ID,
      initialState: '{}',
    },
  }
  await assertFails(
    add('verified', variant, 'variants')
  )
  
  user.name = null
  variant.IMMUTABLE.creatorDisplayName = '@wrong_username'
  await set('admin', user, 'users', MY_ID)
  await assertFails(
    add('verified', variant, 'variants')
  )
  
  variant.IMMUTABLE.creatorDisplayName = '@my_username'
  await set('admin', user, 'users', MY_ID)
  await assertSucceeds(
    add('verified', variant, 'variants')
  )
})

test('cannot remove variant', async () => {
  const user: UserDoc = {
    name: 'My name',
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
      creatorDisplayName: 'My name',
      creatorId: MY_ID,
      initialState: '{}',
    },
  }
  await set('admin', user, 'users', MY_ID)
  await set('admin', variant, 'variants', 'variant_id')
  
  await assertFails(
    remove('verified', 'variants', 'variant_id')
  )
})
