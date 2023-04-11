
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'

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


async function setupUser(id: string, username = 'new_username') {
  const user: UserDoc = {
    name: 'new user',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username,
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  await set('admin', user, 'users', id)
}


test('anyone can read which usernames are already taken', async () => {
  const username: UsernameDoc = { userId: '1234' }
  await set('admin', username, 'usernames', 'abc')
  
  const snapshot = await get('not logged', 'usernames', 'abc')
  if (!snapshot.exists()) {
    throw new Error('Document does not exist')
  }
  expect(snapshot.data().userId).toBe('1234')
  
  const queryResult = await query('not logged', 'usernames')
  expect(queryResult.size).toBe(1)
  expect(queryResult.docs[0].data().userId).toBe('1234')
})

test('can create a username if it is not taken', async () => {
  await setupUser(MY_ID)
  
  const username: UsernameDoc = { userId: MY_ID }
  await assertSucceeds(
    set('unverified', username, 'usernames', 'new_username')
  )
})

test('cannot create a username if not authenticated', async () => {
  await setupUser(MY_ID)
  
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
  await setupUser('A_DIFFERENT_ID')
  
  await assertFails(
    set('verified', { userId: MY_ID }, 'usernames', 'new_username')
  )
})
  
test('cannot steal a taken username', async () => {
  await set('admin', { userId: '1234' }, 'usernames', 'cool_username')
  setupUser('1234', 'cool_username')
  setupUser(MY_ID, 'cool_username') // I'm trying to steal this username
  
  await assertFails(
    // Try to steal cool_username for my own user
    set('verified', { userId: MY_ID }, 'usernames', 'cool_username')
  )
  await assertFails(
    remove('verified', 'usernames', 'cool_username')
  )
})

test('cannot create invalid username', async () => {
  await setupUser(MY_ID, 'a')
  await assertFails(
    set('unverified', { userId: MY_ID }, 'usernames', 'a')
  )
  
  await setupUser(MY_ID, 'a'.repeat(26))
  await assertFails(
    set('unverified', { userId: MY_ID }, 'usernames', 'a'.repeat(26))
  )
  
  await setupUser(MY_ID, 'a space')
  await assertFails(
    set('unverified', { userId: MY_ID }, 'usernames', 'a space')
  )
  
  await setupUser(MY_ID, 'a'.repeat(25))
  await assertSucceeds(
    set('unverified', { userId: MY_ID }, 'usernames', 'a'.repeat(25))
  )
  await remove('admin', 'usernames', 'a'.repeat(25))
  
  await setupUser(MY_ID, 'a'.repeat(3))
  await assertSucceeds(
    set('unverified', { userId: MY_ID }, 'usernames', 'a'.repeat(3))
  )
})

