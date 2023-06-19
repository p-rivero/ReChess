
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from '../utils'
import { setupJest } from '../init'

import type {
  UserDoc,
  UserPrivateDoc,
  UsernameDoc,
} from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, set, update, now, afterSeconds, startBatch }: TestUtilsSignature = notInitialized()

setupJest('user-edit-test', env => {
  ({ get, set, update, now, afterSeconds, startBatch } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function setupUser(name: string|null = null) {
  const username: UsernameDoc = { userId: MY_ID }
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
      lastGamesOpponentIds: [],
      lastGamesVariantIds: [],
    },
  }
  const userPrivate: UserPrivateDoc = {
    IMMUTABLE: {
      email: MY_EMAIL,
    },
  }
  await set('admin', username, 'usernames', 'my_username')
  await set('admin', user, 'users', MY_ID)
  await set('admin', userPrivate, 'users', MY_ID, 'private', 'doc')
}



test('can edit display name after creating user', async () => {
  await setupUser()
    
  await assertSucceeds(
    update('verified', { 'name': 'this is my new name' }, 'users', MY_ID)
  )
  const user = await get('verified', 'users', MY_ID)
  if (!user.exists()) throw new Error('user not found')
  expect(user.data().name).toEqual('this is my new name')
})

test('cannot edit display name before renameAllowedAt', async () => {
  await setupUser()
  await update('admin', { 'IMMUTABLE.renameAllowedAt': afterSeconds(100) }, 'users', MY_ID )
    
  await assertFails(
    update('verified', { 'name': 'this is my new name' }, 'users', MY_ID)
  )
})

test('can edit display name after renameAllowedAt', async () => {
  await setupUser()
  await update('admin', { 'IMMUTABLE.renameAllowedAt': now() }, 'users', MY_ID )
  await new Promise(resolve => setTimeout(resolve, 500))
    
  await assertSucceeds(
    update('verified', { 'name': 'this is my new name' }, 'users', MY_ID)
  )
  const user = await get('verified', 'users', MY_ID)
  if (!user.exists()) throw new Error('user not found')
  expect(user.data().name).toEqual('this is my new name')
})

test('can edit about field', async () => {
  await setupUser()
    
  await assertSucceeds(
    update('verified', { 'about': 'this is my description' }, 'users', MY_ID)
  )
  const user = await get('verified', 'users', MY_ID)
  if (!user.exists()) throw new Error('user not found')
  expect(user.data().about).toEqual('this is my description')
})

test('can edit image', async () => {
  await setupUser()
    
  await assertSucceeds(
    update('verified', { 'profileImg': 'another.png' }, 'users', MY_ID)
  )
  const user = await get('verified', 'users', MY_ID)
  if (!user.exists()) throw new Error('user not found')
  expect(user.data().profileImg).toEqual('another.png')
})

test('cannot edit immutable fields', async () => {
  await setupUser()
  
  // Actual data has not changed, so this should succeed
  await assertSucceeds(
    update('verified', { 'IMMUTABLE.username': 'my_username' }, 'users', MY_ID)
  )
  
  await assertFails(
    update('verified', { 'IMMUTABLE.username': 'new_username' }, 'users', MY_ID)
  )
  await assertFails(
    update('verified', { 'IMMUTABLE.numWinPoints': 10 }, 'users', MY_ID)
  )
  await assertFails(
    update('verified', { 'IMMUTABLE.numGamesPlayed': 10 }, 'users', MY_ID)
  )
  await assertFails(
    update('verified', { 'IMMUTABLE.renameAllowedAt': afterSeconds(2) }, 'users', MY_ID)
  )
})

test('cannot edit immutable private fields', async () => {
  await setupUser()
  
  await assertFails(
    update('verified', { 'IMMUTABLE.email': 'new@mail.com' }, 'users', MY_ID, 'private', 'doc')
  )
})

test('cannot edit profile if banned flag is set', async () => {
  await setupUser()
  await update('admin', { 'banned': true }, 'users', MY_ID)
    
  await assertFails(
    update('verified', { 'name': 'this is my new name' }, 'users', MY_ID)
  )
})

test('cannot manually set banned flag', async () => {
  await setupUser()
    
  await assertFails(
    update('verified', { 'banned': true }, 'users', MY_ID)
  )
})



test('can create renameTrigger without name', async () => {
  await setupUser()
  await assertSucceeds(
    set('verified', { name: null, username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
})

test('can create renameTrigger with name', async () => {
  await setupUser('A name')
  await assertSucceeds(
    set('verified', { name: 'A name', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
})

test('cannot create renameTrigger with incorrect data', async () => {
  await setupUser('A name')
  await assertFails(
    set('verified', { name: 'Another name', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  await assertFails(
    set('verified', { name: 'A name', username: 'another_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  await assertFails(
    set('verified', { name: 'A name', username: null }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  await assertSucceeds(
    set('verified', { name: 'A name', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
})

test('can create renameTrigger if not verified', async () => {
  await setupUser('A name')
  await assertSucceeds(
    set('unverified', { name: 'A name', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
})
test('cannot create renameTrigger for another user', async () => {
  await setupUser('A name')
  await assertFails(
    set('not logged', { name: 'A name', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
})

test('can update renameTrigger using update', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  
  const batch = startBatch('verified')
  batch.update({ name: 'Name 2' }, 'users', MY_ID)
  batch.update({ name: 'Name 2' }, 'users', MY_ID, 'renameTrigger', 'doc')
  await assertSucceeds(batch.commit())
})

test('can update renameTrigger using set', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  
  const batch = startBatch('verified')
  batch.update({ name: 'Name 2' }, 'users', MY_ID)
  batch.set({ name: 'Name 2', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  await assertSucceeds(batch.commit())
})

test('cannot update renameTrigger if not verified', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  
  const batch = startBatch('unverified')
  batch.update({ name: 'Name 2' }, 'users', MY_ID)
  batch.update({ name: 'Name 2' }, 'users', MY_ID, 'renameTrigger', 'doc')
  await assertFails(batch.commit())
})

test('cannot update renameTrigger if name is incorrect', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  
  const batch = startBatch('verified')
  batch.update({ name: 'Name 2' }, 'users', MY_ID)
  batch.update({ name: 'Name 3' }, 'users', MY_ID, 'renameTrigger', 'doc')
  await assertFails(batch.commit())
})

test('cannot update renameTrigger without changing name', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  
  const batch = startBatch('verified')
  batch.update({ name: 'Name 1' }, 'users', MY_ID, 'renameTrigger', 'doc')
  await assertFails(batch.commit())
})


test('can see own renameTrigger', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  await assertSucceeds(
    get('verified', 'users', MY_ID, 'renameTrigger', 'doc')
  )
})

test('cannot see other renameTrigger', async () => {
  await setupUser('Name 1')
  await assertSucceeds(
    set('verified', { name: 'Name 1', username: 'my_username' }, 'users', MY_ID, 'renameTrigger', 'doc')
  )
  await assertFails(
    get('unverified', 'users', MY_ID, 'renameTrigger', 'doc')
  )
})


test('users cannot see their moderation doc', async () => {
  await setupUser('Name 1')
  await assertFails(
    set('verified', { numReports: 0 }, 'users', MY_ID, 'moderation', 'doc')
  )
  await assertFails(
    get('verified', 'users', MY_ID, 'moderation', 'doc')
  )
})
