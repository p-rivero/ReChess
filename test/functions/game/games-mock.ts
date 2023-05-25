import type { GameDoc, VariantDoc, LobbySlotDoc, RequestedColor } from '@/firebase/db/schema'
import admin from 'firebase-admin'
import type { Timestamp } from 'firebase/firestore'

type DB = admin.firestore.Firestore

export async function insertVariant(db: DB, variantId: string, firstPlayerToMove: 'white'|'black'|'invalid-variant') {
  let initialState: string
  if (firstPlayerToMove === 'white') {
    initialState = '{"playerToMove":0}'
  } else if (firstPlayerToMove === 'black') {
    initialState = '{"playerToMove":1}'
  } else if (firstPlayerToMove === 'invalid-variant') {
    initialState = '{}'
  } else {
    throw new Error('invalid firstPlayerToMove')
  }
  const doc: VariantDoc = {
    name: 'Variant Name',
    description: 'Standard chess rules',
    creationTime: admin.firestore.Timestamp.now() as Timestamp,
    creatorDisplayName: 'test',
    creatorId: null,
    numUpvotes: 123,
    popularity: 12,
    tags: [],
    initialState,
  }
  await db.collection('variants').doc(variantId).set(doc)
  return doc
}


export async function insertGame(db: DB, gameId: string, variantId: string, winner?: 'white' | 'black' | 'draw') {
  const variant = await insertVariant(db, variantId, 'white')
  const doc: GameDoc = {
    moveHistory: winner ? 'e2e4 e7e5 g1f3 b8c6 f1b5 c8g4 ' : '',
    playerToMove: winner ? 'game-over' : 'white',
    winner: winner ?? null,
    IMMUTABLE: {
      players: ['whiteName', 'blackName'],
      timeCreated: admin.firestore.Timestamp.now() as Timestamp,
      variantId: 'some_variant_id',
      variant,
      whiteId: 'white_id',
      whiteDisplayName: 'whiteName',
      blackId: 'black_id',
      blackDisplayName: 'blackName',
      requestedColor: 'white',
      calledFinishGame: false,
    },
  }
  await db.collection('games').doc(gameId).set(doc)
  return doc
}

export async function insertLobbySlot(
  db: DB,
  variantId: string,
  creatorId: string,
  challengerId: string | null,
  requestedColor: RequestedColor,
  hasGameDoc = false
) {
  const doc: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'Creator Name',
      creatorImageUrl: null,
      timeCreated: admin.firestore.Timestamp.now() as Timestamp,
      requestedColor,
      gameDocId: hasGameDoc ? 'some_game_id' : null,
    },
    challengerId,
    challengerDisplayName: challengerId ? 'Challenger Name' : null,
    challengerImageUrl: null,
  }
  await db.collection('variants').doc(variantId).collection('lobby').doc(creatorId).set(doc)
  return doc
}
