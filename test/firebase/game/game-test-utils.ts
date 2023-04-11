import { serverTimestamp } from 'firebase/firestore'
import type { LobbySlotDoc, UserDoc, VariantDoc } from '@/firebase/db/schema'
import type { TestUtilsSignature } from '../utils'

const MY_ID = 'my_id'

export type SlotUser = 'alice' | 'bob' | 'myself'

export async function setupUsersAndVariant(set: TestUtilsSignature['set']) {
  const alice: UserDoc = {
    name: 'Alice',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'alice',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const bob: UserDoc = {
    name: 'Bob',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'bob',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const my_user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: serverTimestamp(),
    creatorDisplayName: 'Alice',
    creatorId: 'alice_id',
    numUpvotes: 0,
    initialState: '{}',
  }
  await Promise.all([
    set('admin', alice, 'users', 'alice_id'),
    set('admin', bob, 'users', 'bob_id'),
    set('admin', my_user, 'users', MY_ID),
    set('admin', variant, 'variants', 'variant_id'),
  ])
}

export async function setupLobbySlot(set: TestUtilsSignature['set'], creator: SlotUser, challenger?: SlotUser, gameDocId?: string) {
  const [creatorId, creatorDisplayName] =
    creator === 'alice' ? ['alice_id', 'Alice'] :
    creator === 'bob' ? ['bob_id', 'Bob'] :
    [MY_ID, 'My name']
  const [challengerId, challengerDisplayName] =
    challenger === 'alice' ? ['alice_id', 'Alice'] :
    challenger === 'bob' ? ['bob_id', 'Bob'] :
    challenger === 'myself' ? [MY_ID, 'My name'] :
    [null, null]
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName,
      timeCreated: serverTimestamp(),
      requestedColor: 'random',
    },
    challengerId,
    challengerDisplayName,
    gameDocId: gameDocId ?? null,
  }
  await set('admin', slot, 'variants', 'variant_id', 'lobby', creatorId)
}
