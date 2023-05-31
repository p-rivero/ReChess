
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from './utils'
import { setupJest } from './init'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set }: TestUtilsSignature = notInitialized()

setupJest('misc-tests', env => {
  ({ get, query, set } = setupTestUtils(env, MY_ID, MY_EMAIL))
})



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

test('only moderators can read moderation docs', async () => {
  await assertFails(get('verified', 'cancelledGames', 'some_game_id'))
  await assertFails(query('verified', 'cancelledGames'))
  
  await assertFails(get('verified', 'userModeration', 'some_user_id'))
  await assertFails(query('verified', 'userModeration'))
  
  await assertFails(get('verified', 'variantModeration', 'some_variant_id'))
  await assertFails(query('verified', 'variantModeration'))
  
  await assertFails(get('verified', 'bannedUserData', 'some_user_id'))
  await assertFails(query('verified', 'bannedUserData'))
  
  await assertSucceeds(get('moderator', 'cancelledGames', 'some_game_id'))
  await assertSucceeds(query('moderator', 'cancelledGames'))
  
  await assertSucceeds(get('moderator', 'userModeration', 'some_user_id'))
  await assertSucceeds(query('moderator', 'userModeration'))
  
  await assertSucceeds(get('moderator', 'variantModeration', 'some_variant_id'))
  await assertSucceeds(query('moderator', 'variantModeration'))
  
  // User data backups are not accessed directly by moderators, only the unban function
  await assertFails(get('moderator', 'bannedUserData', 'some_user_id'))
  await assertFails(query('moderator', 'bannedUserData'))
})
