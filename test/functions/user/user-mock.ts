import type { UserDoc, GameSummary } from '@/firebase/db/schema'
import type admin from 'firebase-admin'
import type { UserRecord } from 'firebase-functions/v1/auth'

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

export async function insertUserWithGames(db: DB, userId: string, gamesPlayed: number): Promise<UserDoc> {
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

export async function insertUser(db: DB, user: UserRecord): Promise<UserDoc> {
  const doc: UserDoc = {
    name: user.displayName ?? null,
    about: 'My about section',
    profileImg: user.photoURL ?? null,
    IMMUTABLE: {
      username: 'username_' + randomId(),
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  await db.collection('users').doc(user.uid).set(doc)
  return doc
}
