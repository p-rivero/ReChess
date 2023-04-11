
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import { setupUsersAndVariant, setupLobbySlot, setupGameDoc, setupExtraVariant } from './game-test-utils'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { set, update, remove }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-3', env => {
  ({ set, update, remove } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


// STEP 3: Game is created


test('slot creator can set game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const game_id = await setupGameDoc(set, 'myself', 'bob')

  await assertSucceeds(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('challenger cannot set game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')
  const game_id = await setupGameDoc(set, 'alice', 'myself')

  await assertFails(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('cannot set game id if game doc does not exist', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  await setupGameDoc(set, 'myself', 'bob')

  await assertFails(
    update('verified', {
      gameDocId: 'WRONG_GAME_ID',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('game doc must have same variant', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob') // Slot is set to variant_id
  await setupExtraVariant(set, 'another_variant')
  const game_id = await setupGameDoc(set, 'myself', 'bob', 'random', 'another_variant')

  await assertFails(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await setupGameDoc(set, 'myself', 'bob', 'random', 'variant_id')
  await assertSucceeds(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('game doc must have same requested side', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob', undefined, 'random')
  const game_id = await setupGameDoc(set, 'myself', 'bob', 'white')

  await assertFails(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await setupGameDoc(set, 'myself', 'bob', 'random')
  await assertSucceeds(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('game doc must be created after lobby slot', async () => {
  await setupUsersAndVariant(set)
  const game_id = await setupGameDoc(set, 'myself', 'bob')
  await setupLobbySlot(set, 'myself', 'bob')

  await assertFails(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot remove or modify game id after it is set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const game_id = await setupGameDoc(set, 'myself', 'bob')

  await assertSucceeds(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertFails(
    update('verified', {
      gameDocId: null,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  // ID was already set, so this should fail even though the data is the same
  await assertFails(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot remove or modify challenger when setting game id', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const game_id = await setupGameDoc(set, 'myself', 'bob')

  await assertFails(
    update('verified', {
      gameDocId: game_id,
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertFails(
    update('verified', {
      gameDocId: game_id,
      challengerId: 'alice_id',
      challengerDisplayName: 'Alice',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  // Data has not changed, so this should succeed
  await assertSucceeds(
    update('verified', {
      gameDocId: game_id,
      challengerId: 'bob_id',
      challengerDisplayName: 'Bob',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot remove or modify challenger after game id is set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  const game_id = await setupGameDoc(set, 'myself', 'bob')
  
  await assertSucceeds(
    update('verified', {
      gameDocId: game_id,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertFails(
    update('verified', {
      challengerId: 'alice_id',
      challengerDisplayName: 'Alice',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  // ID was already set, so this should fail even though the data is the same
  await assertFails(
    update('verified', {
      challengerId: 'bob_id',
      challengerDisplayName: 'Bob',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})


// STEP 4: Challenger removes the lobby slot


test('cannot remove slot that does not exist', async () => {
  await setupUsersAndVariant(set)
  
  await assertFails(
    remove('verified', 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('creator can remove lobby slot before challenger joins', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', undefined)
  
  await assertSucceeds(
    remove('verified', 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('creator can remove lobby slot after challenger joins', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  
  await assertSucceeds(
    remove('verified', 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('creator can remove lobby slot after game is created', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob', 'some_game_id')
  
  await assertSucceeds(
    remove('verified', 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot remove lobby slot if not verified', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')
  
  await assertFails(
    remove('unverified', 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot remove a slot from another user', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  await assertFails(
    remove('verified', 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger cannot remove lobby slot before game is created', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')
  
  await assertFails(
    remove('verified', 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger can remove lobby slot after game is created', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself', 'some_game_id')
  
  await assertSucceeds(
    remove('verified', 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})
