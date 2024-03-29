import admin from 'firebase-admin'
import { insertVariant } from '../variant/variant-mock'
import type { GameDoc, LobbySlotDoc, RequestedColor, VariantDoc, GameOverTriggerDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'


export async function insertGame(
  db: admin.firestore.Firestore,
  gameId: string,
  variantId: string,
  winner?: 'white' | 'black' | 'draw',
  createGameOverTrigger = false,
): Promise<GameDoc> {
  const variantSnap = await db.collection('variants').doc(variantId).get()
  const variant = variantSnap.exists ?
      variantSnap.data() as VariantDoc :
      await insertVariant(db, variantId, 'white')
  const doc: GameDoc = {
    moveHistory: winner ? 'e2e4 e7e5 g1f3 b8c6 f1b5 c8g4 ' : '',
    playerToMove: winner ? 'game-over' : 'white',
    winner: winner ?? null,
    IMMUTABLE: {
      players: ['white_id', 'black_id'],
      timeCreated: admin.firestore.Timestamp.now() as Timestamp,
      variantId,
      variant,
      whiteId: 'white_id',
      whiteDisplayName: 'White Name',
      blackId: 'black_id',
      blackDisplayName: 'Black Name',
      requestedColor: 'white',
      calledFinishGame: false,
    },
  }
  await db.collection('games').doc(gameId).set(doc)
  
  if (createGameOverTrigger) {
    const doc: GameOverTriggerDoc = {
      gameOverTime: admin.firestore.Timestamp.now() as Timestamp,
    }
    await db.collection('games').doc(gameId).collection('gameOverTrigger').doc('doc').set(doc)
  }
  
  return doc
}

export async function insertLobbySlot(
  db: admin.firestore.Firestore,
  variantId: string,
  creatorId: string,
  challengerId: string | null,
  requestedColor: RequestedColor,
  hasGameDoc = false
): Promise<LobbySlotDoc> {
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
