
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
} from '../../src/firebase/db/schema'

// Use the same ID as in the emulator if you want to see the requests in the
// emulator UI at: http://127.0.0.1:4000/firestore/requests
const PROJECT_ID = 'rechess-web'

let testEnv: RulesTestEnvironment
let { get, query, set, add, remove }: TestUtilsSignature = notInitialized()

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
  ({ get, query, set, add, remove } = setupTestUtils(testEnv))
})

afterAll(async () => {
  await testEnv.cleanup()
})

// Clear data between tests
afterEach(async () => {
  await testEnv.clearFirestore()
})



// TESTS

test('cannot access collections that do not exist', async () => {
  await assertFails(
    query('someone', 'nonexistent')
  )
  await assertFails(
    get('someone', 'nonexistent', '1234')
  )
  await assertFails(
    set('someone', { foo: 'bar' }, 'nonexistent', '1234')
  )
})


// Usernames

test('anyone can read which usernames are already taken', async () => {
  // Set up the database
  const user: UsernameDoc = { userId: '1234' }
  set('admin', user, 'usernames', 'abc')
  
  const data = await get('everyone', 'usernames', 'abc')
  expect(data).toBeInstanceOf(Array)
  expect(data).toHaveLength(3)
  expect(data[0].userId).toBe('abc')
  
  
  await assertSucceeds(
    query('everyone', 'usernames')
  )
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
  set('admin', user, 'users', '1234')
  
  const username: UsernameDoc = { userId: '1234' }
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
  set('admin', user, 'users', '1234')
  
  const username: UsernameDoc = { userId: '1234' }
  await assertFails(
    set('not logged', username, 'usernames', 'new_username')
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
      username: 'cool_username', // Trying to steal this username
      numWins: 0,
    }
  }
  set('admin', username, 'usernames', 'cool_username')
  set('admin', originalUser, 'users', '1234')
  set('admin', maliciousUser, 'users', '5678')
  
  await assertFails(
    set('someone', {userId: '5678'}, 'usernames', 'cool_username')
  )
  await assertFails(
    remove('someone', 'usernames', 'cool_username')
  )
})

test('cannot create a username without corresponding user', async () => {
  await assertFails(
    set('someone', {userId: '123'}, 'usernames', 'cool_username')
  )
})


// Variants

test('anyone can read created variants', async () => {
  await assertSucceeds(
    get('everyone', 'variants', '1234')
  )
  await assertSucceeds(
    query('everyone', 'variants')
  )
})
