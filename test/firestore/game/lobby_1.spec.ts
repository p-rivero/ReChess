
import { ALICE_ID, BOB_ID, MY_ID, VARIANT_ID, setupExtraVariant, setupGameDoc, setupLobbySlot, setupUsersAndVariant } from './game-test-utils'
import { type TestUtilsSignature, assertFails, assertSucceeds, notInitialized, setupTestUtils } from '../utils'
import { setupJest } from '../init'

import type { LobbySlotDoc } from '@/firebase/db/schema'

let { get, query, set, add, now, afterSeconds }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-1', env => {
  ({ get, query, set, add, now, afterSeconds } = setupTestUtils(env, MY_ID, 'my@email.com'))
})


test('anyone can read lobby entries for a variant', async () => {
  await setupUsersAndVariant(set)
  await setupLobbySlot(set, 'alice', 'bob')
  
  const snapshot = await get('not logged', 'variants', VARIANT_ID, 'lobby', ALICE_ID)
    
  if (!snapshot.exists()) {
    throw new Error('Document does not exist')
  }
  expect(snapshot.data().IMMUTABLE.creatorDisplayName).toBe('Alice')
  expect(snapshot.data().challengerId).toBe(BOB_ID)
  expect(snapshot.data().challengerDisplayName).toBe('Bob')
  expect(snapshot.data().challengerImageUrl).toBe('http://example.com/bob.jpg')
  
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
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot create lobby slot if not authenticated', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertFails(
    set('unverified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', BOB_ID)
  )
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot create lobby slot for a variant that does not exist', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
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
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertFails(
    add('verified', slot, 'variants', VARIANT_ID, 'lobby')
  )
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('can create 2 entries for different variants', async () => {
  await setupUsersAndVariant(set)
  await setupExtraVariant(set, 'variant_id_2')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
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
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot create slot with challenger already set', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: ALICE_ID,
    challengerDisplayName: 'Alice',
    challengerImageUrl: 'http://example.com/alice.jpg',
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  slot.challengerId = null
  slot.challengerDisplayName = null
  slot.challengerImageUrl = null
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('cannot create slot with game id already set', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white', 'white')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: gameId,
  }
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  slot.gameDocId = null
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('creator display name must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'NOT My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'random',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  slot.IMMUTABLE.creatorDisplayName = 'My name'
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('creator profile image must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/ANOTHER_PERSON.jpg',
      timeCreated: now(),
      requestedColor: 'random',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  slot.IMMUTABLE.creatorImageUrl = 'http://example.com/myself.jpg'
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('time created must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: afterSeconds(123),
      requestedColor: 'black',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  slot.IMMUTABLE.timeCreated = now()
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})

test('requested color must be correct', async () => {
  await setupUsersAndVariant(set)
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      creatorImageUrl: 'http://example.com/myself.jpg',
      timeCreated: now(),
      requestedColor: 'wrong_color' as 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
  slot.IMMUTABLE.requestedColor = 'white'
  await assertSucceeds(
    set('verified', slot, 'variants', VARIANT_ID, 'lobby', MY_ID)
  )
})
