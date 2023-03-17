
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'

import type {
  UsernameDoc,
  UserDoc,
  UserPrivateDoc,
} from '../../src/firebase/db/schema'

// Use the same ID as in the emulator if you want to see the requests in the
// emulator UI at: http://127.0.0.1:4000/firestore/requests
const PROJECT_ID = 'rechess-web'
const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let testEnv: RulesTestEnvironment
let { get, query, set, add, remove, startBatch }: TestUtilsSignature = notInitialized()

// CONFIGURE TEST ENVIRONMENT

//! IMPORTANT: make sure the emulator is running (run "npm run dev" in another terminal)

beforeAll(async () => {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: 'localhost',
        port: 8080,
      }
    })
  } catch (e) {
    // Cannot connect to emulator
    process.exit(1)
  }
  // Supress console warnings
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // Set up test utils
  ({ get, query, set, add, remove, startBatch } = setupTestUtils(testEnv, MY_ID, MY_EMAIL))
})

afterAll(async () => {
  await testEnv.cleanup()
})

// Clear data between tests
afterEach(async () => {
  await testEnv.clearFirestore()
})



// MISC. TESTS

test('cannot access collections that do not exist', async () => {
  await assertFails(
    query('verified', 'nonexistent')
  )
  await assertFails(
    get('verified', 'nonexistent', '1234')
  )
  await assertFails(
    set('verified', { foo: 'bar' }, 'nonexistent', '1234')
  )
})



// USERNAMES


test('anyone can read which usernames are already taken', async () => {
  // Set up the database
  const user: UsernameDoc = { userId: '1234' }
  await set('admin', user, 'usernames', 'abc')
  
  const snapshot = await get('not logged', 'usernames', 'abc')
  expect(snapshot.exists()).toBe(true)
  expect(snapshot.data()!.userId).toBe('1234')
  
  const queryResult = await query('not logged', 'usernames')
  expect(queryResult.size).toBe(1)
  expect(queryResult.docs[0].data().userId).toBe('1234')
})

test('can create a username if it is not taken', async () => {
  // Set up the database
  const user: UserDoc = {
    name: 'new user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'new_username',
      numWins: 0,
    }
  }
  await set('admin', user, 'users', MY_ID)
  
  const username: UsernameDoc = { userId: MY_ID }
  await assertSucceeds(
    set('unverified', username, 'usernames', 'new_username')
  )
})

test('cannot create a username if not authenticated', async () => {
  // Set up the database
  const user: UserDoc = {
    name: 'new user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'new_username',
      numWins: 0,
    }
  }
  await set('admin', user, 'users', MY_ID)
  
  await assertFails(
    set('not logged', { userId: MY_ID }, 'usernames', 'new_username')
  )
  await assertFails(
    set('unverified', { userId: 'incorrect_id' }, 'usernames', 'new_username')
  )
  await assertSucceeds(
    set('unverified', { userId: MY_ID }, 'usernames', 'new_username')
  )
})

test('cannot create a username without corresponding user', async () => {
  const user: UserDoc = {
    name: 'new user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'new_username',
      numWins: 0,
    }
  }
  await set('admin', user, 'users', 'A_DIFFERENT_ID')
  
  await assertFails(
    set('verified', {userId: MY_ID}, 'usernames', 'new_username')
  )
})
  
test('cannot steal a taken username', async () => {
  // Set up the database
  const username: UsernameDoc = { userId: '1234' }
  const originalUser: UserDoc = {
    name: 'cool user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'cool_username',
      numWins: 0,
    }
  }
  const maliciousUser: UserDoc = {
    name: 'malicious user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'cool_username', // I'm trying to steal this username
      numWins: 0,
    }
  }
  await set('admin', username, 'usernames', 'cool_username')
  await set('admin', originalUser, 'users', '1234')
  await set('admin', maliciousUser, 'users', MY_ID)
  
  await assertFails(
    // Try to steal this username for my own user
    set('verified', {userId: MY_ID}, 'usernames', 'cool_username')
  )
  await assertFails(
    remove('verified', 'usernames', 'cool_username')
  )
})

test('cannot create invalid username', async () => {
  // Set up the database
  const user: UserDoc = {
    name: 'new user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: '[fill in username]',
      numWins: 0,
    }
  }
  
  user.IMMUTABLE.username = 'a'
  await set('admin', user, 'users', MY_ID)
  await assertFails(
    set('unverified', { userId: MY_ID }, 'usernames', 'a')
  )
  
  user.IMMUTABLE.username = 'a'.repeat(26)
  await set('admin', user, 'users', MY_ID)
  await assertFails(
    set('unverified', { userId: MY_ID }, 'usernames', 'a'.repeat(26))
  )
  
  user.IMMUTABLE.username = 'a space'
  await set('admin', user, 'users', MY_ID)
  await assertFails(
    set('unverified', { userId: MY_ID }, 'usernames', 'a space')
  )
  
  user.IMMUTABLE.username = 'a'.repeat(25)
  await set('admin', user, 'users', MY_ID)
  await assertSucceeds(
    set('unverified', { userId: MY_ID }, 'usernames', 'a'.repeat(25))
  )
  
  await remove('admin', 'usernames', 'a'.repeat(25))
  user.IMMUTABLE.username = 'a'.repeat(3)
  await set('admin', user, 'users', MY_ID)
  await assertSucceeds(
    set('unverified', { userId: MY_ID }, 'usernames', 'a'.repeat(3))
  )
})



// USERS

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
