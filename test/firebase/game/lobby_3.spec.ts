
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import { MY_ID, ALICE_ID, BOB_ID, VARIANT_ID, setupUsersAndVariant, setupLobbySlot, setupGameDoc, setupExtraVariant } from './game-test-utils'

let { set, update, remove }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-3', env => {
  ({ set, update, remove } = setupTestUtils(env, MY_ID, 'my@email.com'))
})


// STEP 3: Game is created


test('slot creator can set game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')

  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('challenger cannot set game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')
  const gameId = await setupGameDoc(set, 'alice', 'myself', 'white')

  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('cannot set game id if game doc does not exist', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  await setupGameDoc(set, 'myself', 'bob', 'white')

  await assertFails(
    update('verified', {
      gameDocId: 'WRONG_GAME_ID',
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('game doc must have same variant', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob') // Slot is set to variant_id
  await setupExtraVariant(set, 'another_variant')
  let gameId = await setupGameDoc(set, 'myself', 'bob', 'white', 'random', 'another_variant')

  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('game doc must have same requested side', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob', undefined, 'random')
  let gameId = await setupGameDoc(set, 'myself', 'bob', 'white', 'white')

  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  gameId = await setupGameDoc(set, 'myself', 'bob', 'white', 'random')
  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('game doc must be created after lobby slot', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await setupLobbySlot(set, 'myself', 'bob')

  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('game doc must have same players', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  
  let gameId = await setupGameDoc(set, 'myself', 'alice', 'white')
  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  
  gameId = await setupGameDoc(set, 'alice', 'bob', 'white')
  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  
  gameId = await setupGameDoc(set, 'bob', 'myself', 'white')
  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot remove or modify game id after it is set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')

  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  await assertFails(
    update('verified', {
      gameDocId: null,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  // ID was already set, so this should fail even though the data is the same
  await assertFails(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot remove or modify challenger when setting game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')

  await assertFails(
    update('verified', {
      gameDocId: gameId,
      challengerId: null,
      challengerDisplayName: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  await assertFails(
    update('verified', {
      gameDocId: gameId,
      challengerId: ALICE_ID,
      challengerDisplayName: 'Alice',
      challengerImageUrl: 'http://example.com/alice.jpg',
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  // Data has not changed, so this should succeed
  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
      challengerId: BOB_ID,
      challengerDisplayName: 'Bob',
      challengerImageUrl: 'http://example.com/bob.jpg',
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot remove or modify challenger after game id is set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  
  await assertSucceeds(
    update('verified', {
      gameDocId: gameId,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
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
