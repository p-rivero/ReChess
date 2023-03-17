
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type {
  UsernameDoc,
  UserDoc,
  UserPrivateDoc,
} from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, startBatch }: TestUtilsSignature = notInitialized()

setupJest('user-tests', env => {
  ({ get, query, set, startBatch } = setupTestUtils(env, MY_ID, MY_EMAIL))
})



test('can create a user if authenticated', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertSucceeds(batch.commit())
})

test('cannot create a user if username is already taken', async () => {
  // Set up the database
  await set('admin', { userId: 'another_user' }, 'usernames', 'my_username')
  
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  await assertFails(
    set('unverified', user, 'users', MY_ID)
  )
  const batch = startBatch('unverified')
  batch.set({ userId: MY_ID }, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertFails(batch.commit())
})

test('cannot create a user if not authenticated', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  const batch = startBatch('not logged')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertFails(batch.commit())
})

test('cannot create a user with more than 0 wins', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 1,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertFails(batch.commit())
})

test('cannot create a banned user', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: true,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertFails(batch.commit())
})

test('can create a user without name or profileImg', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: null,
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertSucceeds(batch.commit())
})

test('cannot create a user without also creating username', async () => {
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  const batch = startBatch('unverified')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertFails(batch.commit())
})

test('cannot create a user without also creating private doc', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  await assertFails(batch.commit())
})

test('cannot create more than one private doc', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
      banned: false,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc2')
  await assertFails(batch.commit())
})

test('email must match auth token', async () => {
  const username: UsernameDoc = { userId: MY_ID }
  const user: UserDoc = {
    name: 'my new user',
    about: '',
    profileImg: 'example.com/img.png',
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
    }
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: 'another@mail.com',
      banned: false,
    }
  }
  const batch = startBatch('unverified')
  batch.set(username, 'usernames', 'my_username')
  batch.set(user, 'users', MY_ID)
  batch.set(userPrivate, 'users', MY_ID, 'private', 'doc')
  await assertFails(batch.commit())
})

  
// VARIANTS


test('anyone can read created variants', async () => {
  await assertSucceeds(
    get('not logged', 'variants', '1234')
  )
  await assertSucceeds(
    query('not logged', 'variants')
  )
})
