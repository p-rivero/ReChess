
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import { setupUsersAndVariant, setupLobbySlot } from './game-test-utils'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { set, update }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-2', env => {
  ({ set, update } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


// STEP 2: Challenger joins the lobby slot

test('can join as challenger', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger must be authenticated', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('unverified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertFails(
    update('verified', {
      challengerId: 'bob_id',
      challengerDisplayName: 'Bob',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger must be different from creator', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('challenger name must be correct', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'A wrong name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger must set both fields at same time', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertFails(
    update('verified', {
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('cannot join if a challenger is already set', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('cannot join a slot that does not exist', async () => {
  await setupUsersAndVariant(set)
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'wrong_id')
  )
})

test('challenger cannot edit game doc', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice')
  
  await assertFails(
    update('verified', {
      gameDocId: 'some_id',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
      gameDocId: 'some_id',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})


test('challenger can leave slot', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')

  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger cannot kick other challenger', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')

  await assertFails(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('slot creator can reject challenger', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself', 'bob')

  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('when leaving must remove all fields', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'myself')

  await assertFails(
    update('verified', {
      challengerId: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertFails(
    update('verified', {
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertFails(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
      gameDocId: 'some_id',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})
