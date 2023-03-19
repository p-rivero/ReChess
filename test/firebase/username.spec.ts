
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type {
  UsernameDoc,
  UserDoc,
} from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, remove }: TestUtilsSignature = notInitialized()

setupJest('username-tests', env => {
  ({ get, query, set, remove } = setupTestUtils(env, MY_ID, MY_EMAIL))
})




test('anyone can read which usernames are already taken', async () => {
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

