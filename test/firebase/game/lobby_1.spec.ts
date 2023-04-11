
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import * as gtu from './game-test-utils'

import type { LobbySlotDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, update, add, now, afterSeconds }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests-1', env => {
  ({ get, query, set, update, add, now, afterSeconds } = setupTestUtils(env, MY_ID, MY_EMAIL))
})

const setupUsersAndVariant = () => gtu.setupUsersAndVariant(set)
const setupLobbySlot = (creator: gtu.SlotUser, challenger?: gtu.SlotUser, gameDocId?: string) => gtu.setupLobbySlot(set, creator, challenger, gameDocId)


test('anyone can read lobby entries for a variant', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'bob')
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  await setupLobbySlot('myself')
  
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
  await setupUsersAndVariant()
  const variant: VariantDoc = {
    name: 'Another variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'Bob',
    creatorId: 'bob_id',
    numUpvotes: 0,
    initialState: '{}',
  }
  await set('admin', variant, 'variants', 'variant_id_2')
  
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
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'bob')
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  
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
  await setupUsersAndVariant()
  
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



// STEP 2: Challenger joins the lobby slot

test('can join as challenger', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice')
  
  await assertSucceeds(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger must be authenticated', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice')
  
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
  await setupUsersAndVariant()
  await setupLobbySlot('myself')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('challenger name must be correct', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'A wrong name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger must set both fields at same time', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice')
  
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
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'bob')
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('cannot join a slot that does not exist', async () => {
  await setupUsersAndVariant()
  
  await assertFails(
    update('verified', {
      challengerId: MY_ID,
      challengerDisplayName: 'My name',
    }, 'variants', 'variant_id', 'lobby', 'wrong_id')
  )
})

test('challenger cannot edit game doc', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice')
  
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
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'myself')

  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('challenger cannot kick other challenger', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'bob')

  await assertFails(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', 'alice_id')
  )
})

test('slot creator can reject challenger', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('myself', 'bob')

  await assertSucceeds(
    update('verified', {
      challengerId: null,
      challengerDisplayName: null,
    }, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('when leaving must remove all fields', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'myself')

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
