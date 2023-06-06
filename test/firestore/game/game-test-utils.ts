import { type Timestamp, serverTimestamp } from 'firebase/firestore'
import type { GameDoc, LobbySlotDoc, RequestedColor, UserDoc, VariantDoc } from '@/firebase/db/schema'
import type { TestUtilsSignature } from '../utils'

export const MY_ID = 'my_id'
export const ALICE_ID = 'alice_id'
export const BOB_ID = 'bob_id'
export const VARIANT_ID = 'variant_id'

const VARIANT_DOC: Readonly<VariantDoc> = {
  name: 'My variant',
  description: 'Variant description',
  creationTime: serverTimestamp() as Timestamp,
  creatorDisplayName: 'Alice',
  creatorId: ALICE_ID,
  numUpvotes: 0,
  popularity: 0,
  tags: [],
  initialState: '{}',
}


export type GameUser = 'alice' | 'bob' | 'myself'

  
function userInfo(user: GameUser): [string, string, string]
function userInfo(user: GameUser | undefined): [string | null, string | null, string | null]
function userInfo(user: GameUser | undefined): [string | null, string | null, string | null] {
  switch (user) {
  case 'alice': return [ALICE_ID, 'Alice', 'http://example.com/alice.jpg']
  case 'bob': return [BOB_ID, 'Bob', 'http://example.com/bob.jpg']
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
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  const bob: UserDoc = {
    name: 'Bob',
    about: '',
    profileImg: 'http://example.com/bob.jpg',
    IMMUTABLE: {
      username: 'bob',
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  const my_user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: 'http://example.com/myself.jpg',
    IMMUTABLE: {
      username: 'my_username',
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  await Promise.all([
    set('admin', alice, 'users', ALICE_ID),
    set('admin', bob, 'users', BOB_ID),
    set('admin', my_user, 'users', MY_ID),
    set('admin', VARIANT_DOC, 'variants', VARIANT_ID),
  ])
}

export async function setupExtraVariant(set: TestUtilsSignature['set'], variantId: string) {
  const variant: VariantDoc = {
    name: 'Extra variant',
    description: 'Extra variant description',
    creationTime: serverTimestamp() as Timestamp,
    creatorDisplayName: 'Alice',
    creatorId: ALICE_ID,
    numUpvotes: 0,
    popularity: 0,
    tags: [],
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
      gameDocId: gameDocId ?? null,
    },
    challengerId,
    challengerDisplayName,
    challengerImageUrl: challengerImage,
  }
  await set('admin', slot, 'variants', VARIANT_ID, 'lobby', creatorId)
}

export async function setupGameDoc(
  set: TestUtilsSignature['set'],
  white: GameUser,
  black: GameUser,
  playerToMove: 'white' | 'black' | 'game-over',
  requestedColor: RequestedColor = 'random',
  variantId = VARIANT_ID
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
      players: [whiteId, blackId],
      timeCreated: serverTimestamp() as Timestamp,
      variantId,
      variant: VARIANT_DOC,
      whiteDisplayName,
      whiteId,
      blackDisplayName,
      blackId,
      requestedColor,
      calledFinishGame: false,
    },
  }
  await set('admin', game, 'games', game_id)
  return game_id
}

export async function setMoveHistory(
  update: TestUtilsSignature['update'],
  gameId: string,
  moveHistory: string,
  playerToMove: 'white' | 'black' | 'game-over'
) {
  await update('admin', {
    moveHistory,
    playerToMove,
  }, 'games', gameId)
}
