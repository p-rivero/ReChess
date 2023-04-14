
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import { MY_ID, ALICE_ID, BOB_ID, VARIANT_ID, setupUsersAndVariant, setupLobbySlot } from './game-test-utils'

let { set, update }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-2', env => {
  ({ set, update } = setupTestUtils(env, MY_ID, 'my@email.com'))
})


// STEP 2: Challenger joins the lobby slot

test('can join as challenger', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('challenger must be authenticated', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('unverified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerId: BOB_ID,
      challengerDisplayName: 'Bob',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('challenger must be different from creator', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('challenger name must be correct', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'A wrong name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('challenger must all fields at same time', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('cannot join if a challenger is already set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('cannot join a slot that does not exist', async () => {
  await setupUsersAndVariant(set)
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', 'wrong_id')
  )
})

test('challenger cannot edit game doc', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('verified', {
      gameDocId: 'some_id',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
      gameDocId: 'some_id',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      challengerImageUrl: 'http://example.com/myself.jpg',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})


test('challenger can leave slot', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')

  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('challenger cannot kick other challenger', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')

  await assertFails(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})

test('slot creator can reject challenger', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')

  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('when leaving must remove all fields', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')

  await assertFails(
    update('verified', {
      challengerId: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerDisplayName: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertFails(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
      challengerImageUrl: null,
      gameDocId: 'some_id',
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
      challengerImageUrl: null,
    }, 'variants', VARIANT_ID, 'lobby', ALICE_ID)
  )
})
