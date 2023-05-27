import type { UserDoc, GameSummary } from '@/firebase/db/schema'
import type admin from 'firebase-admin'

type DB = admin.firestore.Firestore

function randomId(): string {
  const a = Math.random().toString(36).substring(2)
  return a
}

function makeGameSummaries(numGames: number): string {
  const summaries = []
  for (let i = 0; i < numGames; i++) {
    const doc: GameSummary = {
      gameId: randomId(),
      variantId: randomId(),
      variantName: 'Variant Name',
      timeCreatedMs: Date.now() - 1000 * i,
      playedSide: 'white',
      result: 'win',
      opponentId: randomId(),
      opponentName: 'Opponent Name',
    }
    summaries.push(doc)
  }
  return JSON.stringify(summaries)
}

export async function insertUser(db: DB, userId: string, gamesPlayed = 0): Promise<UserDoc> {
  const doc: UserDoc = {
    name: 'User Name',
    about: 'About me',
    profileImg: null,
    IMMUTABLE: {
      username: 'username_' + randomId(),
      renameAllowedAt: null,
      numGamesPlayed: gamesPlayed,
      numWinPoints: 0,
      last5Games: makeGameSummaries(Math.min(gamesPlayed, 5)),
    },
  }
  await db.collection('users').doc(userId).set(doc)
  return doc
}
