import type { UserDoc, GameSummary, UsernameDoc, UserPrivateDoc, TimestampDoc } from '@/firebase/db/schema'
import { UserPrivateCacheDoc } from '@/firebase/db/schema'
import { ReportDoc } from '@/firebase/db/schema'
import { UserRenameTriggerDoc } from '@/firebase/db/schema'
import admin from 'firebase-admin'
import type { UserRecord } from 'firebase-functions/v1/auth'
import type { Timestamp } from 'firebase/firestore'
import type { FeaturesList } from 'firebase-functions-test/lib/features'

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

export async function insertUser(db: DB, user: UserRecord, insertAllDocs = false): Promise<UserDoc> {
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
  if (insertAllDocs) {
    const usernameDoc: UsernameDoc = { userId: user.uid }
    await db.collection('usernames').doc(doc.IMMUTABLE.username).set(usernameDoc)
    const privateDoc: UserPrivateDoc = { IMMUTABLE: { email: user.email ?? 'some@email.com' } }
    await db.collection('users').doc(user.uid).collection('private').doc('doc').set(privateDoc)
    const renameTriggerDoc: UserRenameTriggerDoc = { name: doc.name ?? 'Name', username: doc.IMMUTABLE.username }
    await db.collection('users').doc(user.uid).collection('renameTrigger').doc('doc').set(renameTriggerDoc)
  }
  return doc
}

export async function insertUpvote(db: DB, testEnv: FeaturesList, userId: string, variantId: string) {
  const doc: TimestampDoc = {
    time: admin.firestore.Timestamp.now() as Timestamp
  }
  await db.collection('users').doc(userId).collection('upvotedVariants').doc(variantId).set(doc)
  return testEnv.firestore.makeDocumentSnapshot(doc, `users/${userId}/upvotedVariants/${variantId}`)
}
export async function insertUserReport(db: DB, testEnv: FeaturesList, userId: string, reportedUserId: string, onlyBlock = false) {
  const doc: ReportDoc = {
    time: admin.firestore.Timestamp.now() as Timestamp,
    reason: onlyBlock ? '' : 'Some reason',
    onlyBlock,
  }
  await db.collection('users').doc(userId).collection('reportedUsers').doc(reportedUserId).set(doc)
  return testEnv.firestore.makeDocumentSnapshot(doc, `users/${userId}/reportedUsers/${reportedUserId}`)
}
export async function insertVariantReport(db: DB, testEnv: FeaturesList, userId: string, reportedVariantId: string, onlyBlock = false) {
  const doc: ReportDoc = {
    time: admin.firestore.Timestamp.now() as Timestamp,
    reason: onlyBlock ? '' : 'Some reason',
    onlyBlock,
  }
  await db.collection('users').doc(userId).collection('reportedVariants').doc(reportedVariantId).set(doc)
  return testEnv.firestore.makeDocumentSnapshot(doc, `users/${userId}/reportedVariants/${reportedVariantId}`)
}
