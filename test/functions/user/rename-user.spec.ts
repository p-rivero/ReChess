import { functions, initialize } from '../init'
import { expectNoErrorLog } from '../utils'
import { insertUser } from './user-mock' 
import { makeFirestoreContext } from '../make-context'
import { insertVariant } from '../variant/variant-mock'
import { insertGame } from '../game/games-mock'
import { Change } from 'firebase-functions'
import admin from 'firebase-admin'
import type { UserRenameTriggerDoc } from '@/firebase/db/schema'
import type { UserDoc } from '@/firebase/db/schema'

const { app, testEnv } = initialize('rename-user-test')
const db = app.firestore()
const auth = app.auth()
const renameUser = testEnv.wrap(functions.renameUser)

const USER_ID = 'renamed_user_id'

async function changeName(userDoc: UserDoc, newName: string | null) {
  const username = userDoc.IMMUTABLE.username
  const oldDoc: UserRenameTriggerDoc = {
    name: userDoc.name ?? `@${username}`,
    username,
  }
  const oldSnapshot = testEnv.firestore.makeDocumentSnapshot(oldDoc, `users/${USER_ID}/renameTrigger/doc`)
  const newDoc: UserRenameTriggerDoc = {
    name: newName ?? `@${username}`,
    username,
  }
  const newSnapshot = testEnv.firestore.makeDocumentSnapshot(newDoc, `users/${USER_ID}/renameTrigger/doc`)
  await db.collection('users').doc(USER_ID).update({ name: newName })
  await db.collection('users').doc(USER_ID).collection('renameTrigger').doc('doc').set(newDoc)
  return new Change(oldSnapshot, newSnapshot)
}
async function setRenameTimeout(timeout: Date) {
  const timeoutTimestamp = admin.firestore.Timestamp.fromDate(timeout)
  await db.collection('users').doc(USER_ID).update({
    'IMMUTABLE.renameAllowedAt': timeoutTimestamp,
  })
}
function makeContext() {
  return makeFirestoreContext({ userId: USER_ID })
}

test('user can change display name', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  const userDoc = await insertUser(db, user, true)
  const change = await changeName(userDoc, 'A New Name')
  
  const startTimestamp = Date.now()
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  const endTimestamp = Date.now()
  
  const userDocAfter = await db.collection('users').doc(user.uid).get()
  expect(userDocAfter.data()).toEqual({
    ...userDoc,
    name: 'A New Name',
    IMMUTABLE: {
      ...userDoc.IMMUTABLE,
      renameAllowedAt: expect.anything(),
    },
  })
  const renameAllowedAt = userDocAfter.data()!.IMMUTABLE.renameAllowedAt.toMillis()
  const FIVE_MINUTES = 5 * 60 * 1000
  expect(renameAllowedAt).toBeGreaterThanOrEqual(startTimestamp + FIVE_MINUTES)
  expect(renameAllowedAt).toBeLessThanOrEqual(endTimestamp + FIVE_MINUTES)
})

test('user can delete display name' , async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  const userDoc = await insertUser(db, user, true)
  await setRenameTimeout(new Date(Date.now())) // Existing timeout that should be overwriten
  const change = await changeName(userDoc, null)
  
  const startTimestamp = Date.now()
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  const endTimestamp = Date.now()
  
  const userDocAfter = await db.collection('users').doc(user.uid).get()
  expect(userDocAfter.data()).toEqual({
    ...userDoc,
    name: null,
    IMMUTABLE: {
      ...userDoc.IMMUTABLE,
      renameAllowedAt: expect.anything(),
    },
  })
  const renameAllowedAt = userDocAfter.data()!.IMMUTABLE.renameAllowedAt.toMillis()
  const FIVE_MINUTES = 5 * 60 * 1000
  expect(renameAllowedAt).toBeGreaterThanOrEqual(startTimestamp + FIVE_MINUTES)
  expect(renameAllowedAt).toBeLessThanOrEqual(endTimestamp + FIVE_MINUTES)
})

test('user name is updated in created variants', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  const userDoc = await insertUser(db, user, true)
  const myVariant = await insertVariant(db, 'my_variant', 'white', USER_ID)
  const notMyVariant = await insertVariant(db, 'not_my_variant', 'black', 'someone_else')
  const change = await changeName(userDoc, 'A New Name')
  
  expect(myVariant.creatorId).toBe(USER_ID)
  expect(notMyVariant.creatorId).toBe('someone_else')
  
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  
  const myVariantAfter = await db.collection('variants').doc('my_variant').get()
  expect(myVariantAfter.data()).toEqual({
    ...myVariant,
    creatorDisplayName: 'A New Name',
  })
  const notMyVariantAfter = await db.collection('variants').doc('not_my_variant').get()
  expect(notMyVariantAfter.data()).toEqual(notMyVariant)
})

test('removed user name is updated in created variants', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  const userDoc = await insertUser(db, user, true)
  const username = userDoc.IMMUTABLE.username
  const myVariant = await insertVariant(db, 'my_variant', 'white', USER_ID)
  const notMyVariant = await insertVariant(db, 'not_my_variant', 'black', 'someone_else')
  const change = await changeName(userDoc, null)
  
  expect(myVariant.creatorId).toBe(USER_ID)
  expect(notMyVariant.creatorId).toBe('someone_else')
  
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  
  const myVariantAfter = await db.collection('variants').doc('my_variant').get()
  expect(myVariantAfter.data()).toEqual({
    ...myVariant,
    creatorDisplayName: `@${username}`,
  })
  const notMyVariantAfter = await db.collection('variants').doc('not_my_variant').get()
  expect(notMyVariantAfter.data()).toEqual(notMyVariant)
})

test('user name is updated in played games', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  const userDoc = await insertUser(db, user, true)
  const ongoingGame1 = await insertGame(db, 'game_1', 'some_variant')
  await db.collection('games').doc('game_1').update({
    'IMMUTABLE.whiteId': USER_ID,
    'IMMUTABLE.whiteDisplayName': 'My Old Name',
  })
  const ongoingGame2 = await insertGame(db, 'game_2', 'some_variant')
  await db.collection('games').doc('game_2').update({
    'IMMUTABLE.blackId': USER_ID,
    'IMMUTABLE.blackDisplayName': 'My Old Name',
  })
  const finishedGame1 = await insertGame(db, 'game_3', 'some_variant', 'draw')
  await db.collection('games').doc('game_3').update({
    'IMMUTABLE.whiteId': USER_ID,
    'IMMUTABLE.whiteDisplayName': 'My Old Name',
  })
  const finishedGame2 = await insertGame(db, 'game_4', 'some_variant', 'white')
  await db.collection('games').doc('game_4').update({
    'IMMUTABLE.blackId': USER_ID,
    'IMMUTABLE.blackDisplayName': 'My Old Name',
  })
  const change = await changeName(userDoc, 'A New Name')
  
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  
  const ongoingGame1After = await db.collection('games').doc('game_1').get()
  expect(ongoingGame1After.data()).toEqual({
    ...ongoingGame1,
    IMMUTABLE: {
      ...ongoingGame1.IMMUTABLE,
      whiteId: USER_ID,
      whiteDisplayName: 'A New Name',
    },
  })
  const ongoingGame2After = await db.collection('games').doc('game_2').get()
  expect(ongoingGame2After.data()).toEqual({
    ...ongoingGame2,
    IMMUTABLE: {
      ...ongoingGame2.IMMUTABLE,
      blackId: USER_ID,
      blackDisplayName: 'A New Name',
    },
  })
  const finishedGame1After = await db.collection('games').doc('game_3').get()
  expect(finishedGame1After.data()).toEqual({
    ...finishedGame1,
    IMMUTABLE: {
      ...finishedGame1.IMMUTABLE,
      whiteId: USER_ID,
      whiteDisplayName: 'A New Name',
    },
  })
  const finishedGame2After = await db.collection('games').doc('game_4').get()
  expect(finishedGame2After.data()).toEqual({
    ...finishedGame2,
    IMMUTABLE: {
      ...finishedGame2.IMMUTABLE,
      blackId: USER_ID,
      blackDisplayName: 'A New Name',
    },
  })
})

test('removed user name is updated in played games', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  const userDoc = await insertUser(db, user, true)
  const username = userDoc.IMMUTABLE.username
  const ongoingGame1 = await insertGame(db, 'game_1', 'some_variant')
  await db.collection('games').doc('game_1').update({
    'IMMUTABLE.whiteId': USER_ID,
    'IMMUTABLE.whiteDisplayName': 'My Old Name',
  })
  const ongoingGame2 = await insertGame(db, 'game_2', 'some_variant')
  await db.collection('games').doc('game_2').update({
    'IMMUTABLE.blackId': USER_ID,
    'IMMUTABLE.blackDisplayName': 'My Old Name',
  })
  const change = await changeName(userDoc, null)
  
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  
  const ongoingGame1After = await db.collection('games').doc('game_1').get()
  expect(ongoingGame1After.data()).toEqual({
    ...ongoingGame1,
    IMMUTABLE: {
      ...ongoingGame1.IMMUTABLE,
      whiteId: USER_ID,
      whiteDisplayName: `@${username}`
    },
  })
  const ongoingGame2After = await db.collection('games').doc('game_2').get()
  expect(ongoingGame2After.data()).toEqual({
    ...ongoingGame2,
    IMMUTABLE: {
      ...ongoingGame2.IMMUTABLE,
      blackId: USER_ID,
      blackDisplayName: `@${username}`
    },
  })
})
