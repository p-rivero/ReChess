
import { ALICE_ID, BOB_ID, MY_ID, VARIANT_ID, setupGameDoc, setupLobbySlot, setupUsersAndVariant } from './game-test-utils'
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from '../utils'
import { setupJest } from '../init'

let { set, update, remove }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-3', env => {
  ({ set, update, remove } = setupTestUtils(env, MY_ID, 'my@email.com'))
})


// STEP 3: Game is created (obsolete: now the game doc is set by the cloud function)


test('slot creator cannot set game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')

  // The game id must be set by the cloud function, not by the client
  await assertFails(
    update('verified', {
      'IMMUTABLE.gameDocId': gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('challenger cannot set game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')
  const gameId = await setupGameDoc(set, 'alice', 'myself', 'white')

  await assertFails(
    update('verified', {
      'IMMUTABLE.gameDocId': gameId,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('cannot remove or modify challenger after game id is set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  update('admin', {
    'IMMUTABLE.gameDocId': gameId,
  }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  
  await assertFails(
    update('verified', {
      challengerId: ALICE_ID,
      challengerDisplayName: 'Alice',
      challengerImageUrl: 'http://example.com/alice.jpg',
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  // ID was already set, so this should fail even though the data is the same
  await assertFails(
    update('verified', {
      challengerId: BOB_ID,
      challengerDisplayName: 'Bob',
      challengerImageUrl: 'http://example.com/bob.jpg',
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})


// STEP 4: Challenger removes the lobby slot


test('cannot remove slot that does not exist', async () => {
  await setupUsersAndVariant(set)
  
  await assertFails(
    remove('verified', 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('creator can remove lobby slot before challenger joins', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself')
  
  await assertSucceeds(
    remove('verified', 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('creator can remove lobby slot after challenger joins', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  
  await assertSucceeds(
    remove('verified', 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('creator can remove lobby slot after game is created', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob', 'some_game_id')
  
  await assertSucceeds(
    remove('verified', 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot remove lobby slot if not verified', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  
  await assertFails(
    remove('unverified', 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot remove a slot from another user', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  await assertFails(
    remove('verified', 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('challenger cannot remove lobby slot before game is created', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')
  
  await assertFails(
    remove('verified', 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('challenger can remove lobby slot after game is created', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself', 'some_game_id')
  
  await assertSucceeds(
    remove('verified', 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})
