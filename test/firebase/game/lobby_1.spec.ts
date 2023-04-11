
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import { setupUsersAndVariant, setupLobbySlot, setupExtraVariant } from './game-test-utils'

import type { LobbySlotDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, add, now, afterSeconds }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-1', env => {
  ({ get, query, set, add, now, afterSeconds } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


test('anyone can read lobby entries for a variant', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  const snapshot = await get('not logged', 'variants', 'variant_id', 'lobby', 'alice_id')
    
  if (!snapshot.exists()) {
    throw new Error('Document does not exist')
  }
  expect(snapshot.data().IMMUTABLE.creatorDisplayName).toBe('Alice')
  expect(snapshot.data().challengerId).toBe('bob_id')
  expect(snapshot.data().challengerDisplayName).toBe('Bob')
  
  const queryResult = await query('not logged', 'variants/variant_id/lobby')
  expect(queryResult.size).toBe(1)
  expect(queryResult.docs[0].data().challengerDisplayName).toBe('Bob')
})



// STEP 1: Create a lobby slot


test('can create lobby slot', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create lobby slot if not authenticated', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('unverified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', 'bob_id')
  )
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create lobby slot for a variant that does not exist', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'wrong_id', 'lobby', MY_ID)
  )
})

test('cannot create 2 entries for the same variant', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'myself')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    add('verified', slot, 'variants', 'variant_id', 'lobby')
  )
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('can create 2 entries for different variants', async () => {
  await setupUsersAndVariant(set)
  await setupExtraVariant(set, 'variant_id_2')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id_2', 'lobby', MY_ID)
  )
})

test('2 creators can create entries for the same variant', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create slot with challenger already set', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: 'alice_id',
    challengerDisplayName: 'Alice',
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.challengerId = null
  slot.challengerDisplayName = null
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create slot with game id already set', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: 'game_id',
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.gameDocId = null
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('creator display name must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'NOT My name',
      timeCreated: now(),
      requestedColor: 'random',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.IMMUTABLE.creatorDisplayName = 'My name'
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('time created must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: afterSeconds(123),
      requestedColor: 'black',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.IMMUTABLE.timeCreated = now()
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('requested color must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'wrong_color' as 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.IMMUTABLE.requestedColor = 'white'
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})