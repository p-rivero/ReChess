import { serverTimestamp } from 'firebase/firestore'
import type { RequestedColor, GameDoc, LobbySlotDoc, UserDoc, VariantDoc } from '@/firebase/db/schema'
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

  
function userInfo(user: GameUser): [string, string, string]
function userInfo(user: GameUser | undefined): [string | null, string | null, string | null]
function userInfo(user: GameUser | undefined): [string | null, string | null, string | null] {
  switch (user) {
    case 'alice': return ['alice_id', 'Alice', 'http://example.com/alice.jpg']
    case 'bob': return ['bob_id', 'Bob', 'http://example.com/bob.jpg']
    case 'myself': return [MY_ID, 'My name', 'http://example.com/myself.jpg']
    default: return [null, null, null]
  }
}

export async function setupUsersAndVariant(set: TestUtilsSignature['set']) {
  const alice: UserDoc = {
    name: 'Alice',
    about: '',
    profileImg: 'http://example.com/alice.jpg',
    IMMUTABLE: {
      username: 'alice',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const bob: UserDoc = {
    name: 'Bob',
    about: '',
    profileImg: 'http://example.com/bob.jpg',
    IMMUTABLE: {
      username: 'bob',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const my_user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: 'http://example.com/myself.jpg',
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
  requestedColor: RequestedColor = 'random'
) {
  const [creatorId, creatorDisplayName, creatorImage] = userInfo(creator)
  const [challengerId, challengerDisplayName, challengerImage] = userInfo(challenger)
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName,
      creatorImageUrl: creatorImage,
      timeCreated: serverTimestamp() as Timestamp,
      requestedColor,
    },
    challengerId,
    challengerDisplayName,
    challengerImageUrl: challengerImage,
    gameDocId: gameDocId ?? null,
  }
  await set('admin', slot, 'variants', 'variant_id', 'lobby', creatorId)
}

export async function setupGameDoc(
  set: TestUtilsSignature['set'],
  white: GameUser,
  black: GameUser,
  requestedColor: RequestedColor = 'random',
  variantId = 'variant_id',
  playerToMove: 'white' | 'black' | 'game-over' = 'white'
): Promise<string> {
  const [whiteId, whiteDisplayName] = userInfo(white)
  const [blackId, blackDisplayName] = userInfo(black)
  const randomInt = Math.floor(Math.random() * 100000)
  const game_id = `game_${whiteId}_${blackId}_${randomInt}`
  const game: GameDoc = {
    moveHistory: '',
    playerToMove,
    winner: playerToMove === 'game-over' ? 'white' : null,
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

export async function setMoveHistory(
  update: TestUtilsSignature['update'],
  gameId: string,
  moveHistory: string
) {
  await update('admin', { moveHistory }, 'games', gameId)
}
