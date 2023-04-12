import { serverTimestamp } from 'firebase/firestore'
import type { GameDoc, LobbySlotDoc, UserDoc, VariantDoc } from '@/firebase/db/schema'
import type { TestUtilsSignature } from '../utils'
import type { Timestamp } from 'firebase/firestore'

const MY_ID = 'my_id'

const VARIANT_DOC: Readonly<VariantDoc> = {
  name: 'My variant',
  description: 'Variant description',
  creationTime: serverTimestamp() as Timestamp,
  creatorDisplayName: 'Alice',
  creatorId: 'alice_id',
  numUpvotes: 0,
  initialState: '{}',
}


export type GameUser = 'alice' | 'bob' | 'myself'

  
function idAndName(user: GameUser): [string, string]
function idAndName(user: GameUser | undefined): [string | null, string | null]
function idAndName(user: GameUser | undefined): [string | null, string | null] {
  switch (user) {
    case 'alice': return ['alice_id', 'Alice']
    case 'bob': return ['bob_id', 'Bob']
    case 'myself': return [MY_ID, 'My name']
    default: return [null, null]
  }
}

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
  await Promise.all([
    set('admin', alice, 'users', 'alice_id'),
    set('admin', bob, 'users', 'bob_id'),
    set('admin', my_user, 'users', MY_ID),
    set('admin', VARIANT_DOC, 'variants', 'variant_id'),
  ])
}

export async function setupExtraVariant(set: TestUtilsSignature['set'], variantId: string) {
  const variant: VariantDoc = {
    name: 'Extra variant',
    description: 'Extra variant description',
    creationTime: serverTimestamp() as Timestamp,
    creatorDisplayName: 'Alice',
    creatorId: 'alice_id',
    numUpvotes: 0,
    initialState: '{}',
  }
  await set('admin', variant, 'variants', variantId)
}

export async function setupLobbySlot(
  set: TestUtilsSignature['set'],
  creator: GameUser,
  challenger?: GameUser,
  gameDocId?: string,
  requestedColor: 'white' | 'black' | 'random' = 'random'
) {
  const [creatorId, creatorDisplayName] = idAndName(creator)
  const [challengerId, challengerDisplayName] = idAndName(challenger)
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName,
      timeCreated: serverTimestamp() as Timestamp,
      requestedColor,
    },
    challengerId,
    challengerDisplayName,
    gameDocId: gameDocId ?? null,
  }
  await set('admin', slot, 'variants', 'variant_id', 'lobby', creatorId)
}

export async function setupGameDoc(
  set: TestUtilsSignature['set'],
  white: GameUser,
  black: GameUser,
  requestedColor: 'white' | 'black' | 'random' = 'random',
  variantId = 'variant_id'
): Promise<string> {
  const [whiteId, whiteDisplayName] = idAndName(white)
  const [blackId, blackDisplayName] = idAndName(black)
  const game_id = `game_${whiteId}_${blackId}`
  const game: GameDoc = {
    moveHistory: '',
    playerToMove: 'white',
    winner: null,
    IMMUTABLE: {
      timeCreated: serverTimestamp() as Timestamp,
      variantId,
      variant: VARIANT_DOC,
      whiteDisplayName,
      whiteId,
      blackDisplayName,
      blackId,
      requestedColor,
    },
  }
  await set('admin', game, 'games', game_id)
  return game_id
}
