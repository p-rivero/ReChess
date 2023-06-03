import { expectHttpsError, expectLog, expectNoErrorLog, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeModeratorContext, insertReport } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import { insertUser } from '../user/user-mock'
import type { UserDoc, GameDoc, VariantDoc } from '@/firebase/db/schema'
import { insertGame } from '../game/games-mock'
import { insertVariant } from '../variant/variant-mock'

const { app, testEnv } = initialize('unban-user-test')
const db = app.firestore()
const auth = app.auth()
const unbanUser = testEnv.wrap(functions.unbanUser)
const banUser = testEnv.wrap(functions.banUser)
const wipeUser = testEnv.wrap(functions.wipeUser)

const MODERATOR_ID = 'moderator_user_id'
const BANNED_ID = 'banned_user_id'

function makeArgs(bannedUserId: string) {
  return { userId: bannedUserId }
}

test('moderator can unban a previously banned user', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({
    uid: BANNED_ID,
    displayName: 'The Banned User',
    photoURL: 'https://example.com/banned-user.png',
  })
  const oldUserDoc = await insertUser(db, user)
  
  const done = expectNoErrorLog()
  await expectSuccess(banUser(args, context))
  await expectSuccess(unbanUser(args, context))
  done()
  
  const newUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const userRecord = await auth.getUser(BANNED_ID)
  
  expect(newUserDoc).toEqual({
    name: 'The Banned User',
    about: oldUserDoc.about,
    profileImg: 'https://example.com/banned-user.png',
    IMMUTABLE: oldUserDoc.IMMUTABLE,
  })
  expect(userRecord.disabled).toBe(false)
})

test('user name is restored in played games', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID, displayName: 'The Banned User' })
  await insertUser(db, user)
  const ongoingGameBefore = await insertGame(db, 'game_id_ongoing', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing').update({ 
    'IMMUTABLE.whiteId': BANNED_ID,
    'IMMUTABLE.whiteDisplayName': 'The Banned User',
  })
  const ongoingGameBefore2 = await insertGame(db, 'game_id_ongoing_2', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing_2').update({ 
    'IMMUTABLE.blackId': BANNED_ID,
    'IMMUTABLE.blackDisplayName': 'The Banned User',
  })
  const finishedGameBefore = await insertGame(db, 'game_id_finished', 'some_variant_id', 'white')
  await db.collection('games').doc('game_id_finished').update({
    'IMMUTABLE.blackId': BANNED_ID,
    'IMMUTABLE.blackDisplayName': 'The Banned User',
  })
  
  const done = expectNoErrorLog()
  await expectSuccess(banUser(args, context))
  await expectSuccess(unbanUser(args, context))
  done()
  
  const ongoingGameAfter = (await db.collection('games').doc('game_id_ongoing').get()).data() as GameDoc
  const ongoingGameAfter2 = (await db.collection('games').doc('game_id_ongoing_2').get()).data() as GameDoc
  const finishedGameAfter = (await db.collection('games').doc('game_id_finished').get()).data() as GameDoc
  
  expect(ongoingGameAfter).toEqual({
    ...ongoingGameBefore,
    playerToMove: 'game-over',
    winner: 'black', // The other player wins
    IMMUTABLE: {
      ...ongoingGameBefore.IMMUTABLE,
      whiteId: BANNED_ID,
      whiteDisplayName: 'The Banned User',
      calledFinishGame: true,
    }
  })
  expect(ongoingGameAfter2).toEqual({
    ...ongoingGameBefore2,
    playerToMove: 'game-over',
    winner: 'white', // The other player wins
    IMMUTABLE: {
      ...ongoingGameBefore2.IMMUTABLE,
      blackId: BANNED_ID,
      blackDisplayName: 'The Banned User',
      calledFinishGame: true,
    }
  })
  expect(finishedGameAfter).toEqual({
    ...finishedGameBefore,
    winner: 'white', // Winner is not changed
    IMMUTABLE: {
      ...finishedGameBefore.IMMUTABLE,
      blackId: BANNED_ID,
      blackDisplayName: 'The Banned User',
    }
  })
})

test('default user name is restored in played games', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  const userDoc = await insertUser(db, user)
  const ongoingGameBefore = await insertGame(db, 'game_id_ongoing', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing').update({ 
    'IMMUTABLE.whiteId': BANNED_ID,
  })
  const ongoingGameBefore2 = await insertGame(db, 'game_id_ongoing_2', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing_2').update({ 
    'IMMUTABLE.blackId': BANNED_ID,
  })
  const finishedGameBefore = await insertGame(db, 'game_id_finished', 'some_variant_id', 'white')
  await db.collection('games').doc('game_id_finished').update({
    'IMMUTABLE.blackId': BANNED_ID,
  })
  
  const done = expectNoErrorLog()
  await expectSuccess(banUser(args, context))
  await expectSuccess(unbanUser(args, context))
  done()
  
  const ongoingGameAfter = (await db.collection('games').doc('game_id_ongoing').get()).data() as GameDoc
  const ongoingGameAfter2 = (await db.collection('games').doc('game_id_ongoing_2').get()).data() as GameDoc
  const finishedGameAfter = (await db.collection('games').doc('game_id_finished').get()).data() as GameDoc
  
  const expectedDisplayName = `@${userDoc.IMMUTABLE.username}`
  expect(ongoingGameAfter).toEqual({
    ...ongoingGameBefore,
    playerToMove: 'game-over',
    winner: 'black', // The other player wins
    IMMUTABLE: {
      ...ongoingGameBefore.IMMUTABLE,
      whiteId: BANNED_ID,
      whiteDisplayName: expectedDisplayName,
      calledFinishGame: true,
    }
  })
  expect(ongoingGameAfter2).toEqual({
    ...ongoingGameBefore2,
    playerToMove: 'game-over',
    winner: 'white', // The other player wins
    IMMUTABLE: {
      ...ongoingGameBefore2.IMMUTABLE,
      blackId: BANNED_ID,
      blackDisplayName: expectedDisplayName,
      calledFinishGame: true,
    }
  })
  expect(finishedGameAfter).toEqual({
    ...finishedGameBefore,
    winner: 'white', // Winner is not changed
    IMMUTABLE: {
      ...finishedGameBefore.IMMUTABLE,
      blackId: BANNED_ID,
      blackDisplayName: expectedDisplayName,
    }
  })
})

test('user name is restored in created variants', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID, displayName: 'The Banned User' })
  await insertUser(db, user)
  const variantBefore = await insertVariant(db, 'variant_id', 'white', BANNED_ID)
  
  const done = expectNoErrorLog()
  await expectSuccess(banUser(args, context))
  await expectSuccess(unbanUser(args, context))
  done()
  
  const variantAfter = (await db.collection('variants').doc('variant_id').get()).data() as VariantDoc
  
  expect(variantAfter).toEqual({
    ...variantBefore,
    creatorId: BANNED_ID,
    creatorDisplayName: 'The Banned User',
  })
})

test('default user name is restored in created variants', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  const userDoc = await insertUser(db, user)
  const variantBefore = await insertVariant(db, 'variant_id', 'white', BANNED_ID)
  
  const done = expectNoErrorLog()
  await expectSuccess(banUser(args, context))
  await expectSuccess(unbanUser(args, context))
  done()
  
  const variantAfter = (await db.collection('variants').doc('variant_id').get()).data() as VariantDoc
  
  expect(variantAfter).toEqual({
    ...variantBefore,
    creatorId: BANNED_ID,
    creatorDisplayName: `@${userDoc.IMMUTABLE.username}`,
  })
})

test('unbanning a user that is not banned does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({
    uid: BANNED_ID,
    displayName: 'The Banned User',
    photoURL: 'https://example.com/banned-user.png',
  })
  const oldUserDoc = await insertUser(db, user)
  
  const done = expectLog('warn', 'The user is not banned: banned_user_id')
  await expectSuccess(unbanUser(args, context))
  done()
  
  const newUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const userRecord = await auth.getUser(BANNED_ID)
  
  expect(newUserDoc).toEqual({
    name: 'The Banned User',
    about: oldUserDoc.about,
    profileImg: 'https://example.com/banned-user.png',
    IMMUTABLE: oldUserDoc.IMMUTABLE,
  })
  expect(userRecord.disabled).toBe(false)
})

test('banned user data is cleared', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, user)
  await db.collection('users').doc(BANNED_ID).update({
    name: 'The Banned User',
    about: 'I am a banned user.',
    profileImg: 'https://example.com/banned-user.png',
  })
  await insertVariant(db, 'variant_1', 'white', BANNED_ID)
  await insertVariant(db, 'variant_2', 'white', BANNED_ID)
  
  await expectSuccess(banUser(args, context))
  
  const backupBefore = await db.collection('bannedUserData').doc(BANNED_ID).get()
  expect(backupBefore.exists).toBe(true)
  
  await expectSuccess(unbanUser(args, context))
  
  const backupAfter = await db.collection('bannedUserData').doc(BANNED_ID).get()
  expect(backupAfter.exists).toBe(false)
})

test('user reports are preserved', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, user)
  await insertReport(db, BANNED_ID, 'user', 'a_reported_user_id')
  await insertReport(db, BANNED_ID, 'variant', 'a_reported_variant_id')
  
  await expectSuccess(banUser(args, context))
  await expectSuccess(unbanUser(args, context))
  
  const userReports = await db.collection('userModeration').doc('a_reported_user_id').get()
  const variantReports = await db.collection('variantModeration').doc('a_reported_variant_id').get()
  const createdUserReport = await db.collection('users').doc(BANNED_ID)
      .collection('reportedUsers').doc('a_reported_user_id').get()
  const createdVariantReport = await db.collection('users').doc(BANNED_ID)
      .collection('reportedVariants').doc('a_reported_variant_id').get()
  
  expect(userReports.data()?.numReports).toEqual(1)
  expect(variantReports.data()?.numReports).toEqual(1)
  expect(createdUserReport.exists).toEqual(true)
  expect(createdVariantReport.exists).toEqual(true)
})



test('arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, user)
  
  let arg = {}
  let e = await expectHttpsError(unbanUser(arg, context))
  expect(e.message).toMatch('The function must be called with a userId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: 123 }
  e = await expectHttpsError(unbanUser(arg, context))
  expect(e.message).toMatch('The userId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: BANNED_ID }
  const done = expectLog('warn', 'The user is not banned: banned_user_id')
  await expectSuccess(unbanUser(arg, context))
  done()
})

test('caller must be authenticated as a moderator', async () => {
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, user)
  
  let context = makeCallableContext(null)
  let e = await expectHttpsError(unbanUser(args, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, false)
  e = await expectHttpsError(unbanUser(args, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, false)
  e = await expectHttpsError(unbanUser(args, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, true)
  e = await expectHttpsError(unbanUser(args, context))
  expect(e.message).toMatch('The user must be a moderator.')
  expect(e.code).toBe('permission-denied')
  
  context = makeModeratorContext(MODERATOR_ID)
  const done = expectLog('warn', 'The user is not banned: banned_user_id')
  await expectSuccess(unbanUser(args, context))
  done()
})

test('cannot unban a user that does not exist', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  
  const e = await expectHttpsError(unbanUser(args, context))
  expect(e.message).toMatch(`The user ${BANNED_ID} does not exist.`)
  expect(e.code).toBe('not-found')
})

test('cannot unban a user if their data has been wiped', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  const user = await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, user)
  await insertReport(db, BANNED_ID, 'user', 'a_reported_user_id')
  await insertReport(db, BANNED_ID, 'variant', 'a_reported_variant_id')
  
  await expectSuccess(wipeUser(args, context))
  
  let e = await expectHttpsError(unbanUser(args, context))
  expect(e.message).toMatch(`Cannot find backup of user ${BANNED_ID}.`)
  expect(e.code).toBe('not-found')
})
