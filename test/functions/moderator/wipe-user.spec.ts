import { expectHttpsError, expectLog, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeModeratorContext } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import { insertUser } from '../user/user-mock'
import type { UserDoc, GameDoc } from '@/firebase/db/schema'
import { insertGame } from '../game/games-mock'
import { insertVariant } from '../variant/variant-mock'

const { app, testEnv } = initialize('wipe-user-test')
const db = app.firestore()
const auth = app.auth()
const storage = app.storage()
const wipeUser = testEnv.wrap(functions.wipeUser)

const MODERATOR_ID = 'moderator_user_id'
const WIPED_ID = 'wiped_user_id'

function makeArgs(wipedUserId: string) {
  return { userId: wipedUserId }
}

test('moderator can wipe a user', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({
    uid: WIPED_ID,
    displayName: 'The Wiped User',
    photoURL: 'https://example.com/wiped-user.png',
  })
  const oldUserDoc = await insertUser(db, WIPED_ID)
  
  await expectSuccess(wipeUser(args, context))
  
  const newUserDoc = (await db.collection('users').doc(WIPED_ID).get()).data() as UserDoc
  const userRecord = await auth.getUser(WIPED_ID)
  
  expect(newUserDoc).toEqual({
    name: '[deleted]',
    about: '',
    profileImg: null,
    banned: true,
    IMMUTABLE: oldUserDoc.IMMUTABLE,
  })
  expect(userRecord.disabled).toBe(true)
})

test('user name is removed from games', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({ uid: WIPED_ID })
  await insertUser(db, WIPED_ID)
  const ongoingGameBefore = await insertGame(db, 'game_id_ongoing', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing').update({ 
    'IMMUTABLE.whiteId': WIPED_ID,
    'IMMUTABLE.whiteDisplayName': 'The Wiped User',
  })
  const ongoingGameBefore2 = await insertGame(db, 'game_id_ongoing_2', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing_2').update({ 
    'IMMUTABLE.blackId': WIPED_ID,
    'IMMUTABLE.blackDisplayName': 'The Wiped User',
  })
  const finishedGameBefore = await insertGame(db, 'game_id_finished', 'some_variant_id', 'white')
  await db.collection('games').doc('game_id_finished').update({
    'IMMUTABLE.blackId': WIPED_ID,
    'IMMUTABLE.blackDisplayName': 'The Wiped User',
  })
  
  await expectSuccess(wipeUser(args, context))
  
  const ongoingGameAfter = (await db.collection('games').doc('game_id_ongoing').get()).data() as GameDoc
  const ongoingGameAfter2 = (await db.collection('games').doc('game_id_ongoing_2').get()).data() as GameDoc
  const finishedGameAfter = (await db.collection('games').doc('game_id_finished').get()).data() as GameDoc
  
  expect(ongoingGameAfter).toEqual({
    ...ongoingGameBefore,
    playerToMove: 'game-over',
    winner: 'black',
    IMMUTABLE: {
      ...ongoingGameBefore.IMMUTABLE,
      whiteId: null,
      whiteDisplayName: '[deleted]',
      calledFinishGame: true,
    }
  })
  expect(ongoingGameAfter2).toEqual({
    ...ongoingGameBefore2,
    playerToMove: 'game-over',
    winner: 'white',
    IMMUTABLE: {
      ...ongoingGameBefore2.IMMUTABLE,
      blackId: null,
      blackDisplayName: '[deleted]',
      calledFinishGame: true,
    }
  })
  expect(finishedGameAfter).toEqual({
    ...finishedGameBefore,
    winner: 'white', // Winner is not changed
    IMMUTABLE: {
      ...finishedGameBefore.IMMUTABLE,
      blackId: null,
      blackDisplayName: '[deleted]',
    }
  })
})

test('created variants are removed', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({ uid: WIPED_ID })
  await insertUser(db, WIPED_ID)
  await insertVariant(db, 'variant_id', 'white', WIPED_ID)
  await insertGame(db, 'game_1', 'variant_id', 'draw')
  await insertGame(db, 'game_2', 'another_variant')
  
  const done = expectLog('error', 'Could not find index entry for variant_id')
  await expectSuccess(wipeUser(args, context))
  done()
  
  const variantAfter = await db.collection('variants').doc('variant_id').get()
  expect(variantAfter.exists).toBe(false)
  const game1After = await db.collection('games').doc('game_1').get()
  expect(game1After.exists).toBe(false)
  const game2After = await db.collection('games').doc('game_2').get()
  expect(game2After.exists).toBe(true)
})

test('created reports are removed', async () => {
  
})

test('wiping a user twice does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({
    uid: WIPED_ID,
    displayName: 'The Wiped User',
    photoURL: 'https://example.com/wiped-user.png',
  })
  await insertUser(db, WIPED_ID)
  
  await expectSuccess(wipeUser(args, context))
  const newUserDoc = (await db.collection('users').doc(WIPED_ID).get()).data() as UserDoc
  const newUserRecord = await auth.getUser(WIPED_ID)
  
  const done = expectLog('warn', 'The user is already banned: wiped_user_id')
  await expectSuccess(wipeUser(args, context))
  done()
  const veryNewUserDoc = (await db.collection('users').doc(WIPED_ID).get()).data() as UserDoc
  const veryNewUserRecord = await auth.getUser(WIPED_ID)
  
  expect(newUserDoc).toEqual(veryNewUserDoc)
  expect(newUserRecord).toEqual(veryNewUserRecord)
})

test('ban a user and then wipe them', async () => {
  
})

test('banned user data is not stored', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({ uid: WIPED_ID })
  const oldUserDoc = await insertUser(db, WIPED_ID)
  await db.collection('users').doc(WIPED_ID).update({
    name: 'The Wiped User',
    about: 'I am a wiped user.',
    profileImg: 'https://example.com/wiped-user.png',
  })
  
  await expectSuccess(wipeUser(args, context))
  
  const newUserDoc = (await db.collection('users').doc(WIPED_ID).get()).data() as UserDoc
  const bannedUserData = await db.collection('bannedUserData').doc(WIPED_ID).get()
  
  expect(newUserDoc).toEqual({
    name: '[deleted]',
    about: '',
    profileImg: null,
    banned: true,
    IMMUTABLE: oldUserDoc.IMMUTABLE,
  })
  expect(bannedUserData.exists).toEqual(false)
})

test('user profile picture is deleted', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({ uid: WIPED_ID })
  await insertUser(db, WIPED_ID)
  await storage.bucket().file(`profile-images/${WIPED_ID}`).save('some data')
  
  const fileBefore = storage.bucket().file(`profile-images/${WIPED_ID}`)
  const [existsBefore] = await fileBefore.exists()
  expect(existsBefore).toBe(true)
  
  await expectSuccess(wipeUser(args, context))
  
  const file = storage.bucket().file(`profile-images/${WIPED_ID}`)
  const [exists] = await file.exists()
  expect(exists).toBe(false)
})



test('arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await auth.createUser({ uid: WIPED_ID })
  await insertUser(db, WIPED_ID)
  
  let arg = {}
  let e = await expectHttpsError(wipeUser(arg, context))
  expect(e.message).toMatch('The function must be called with a userId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: 123 }
  e = await expectHttpsError(wipeUser(arg, context))
  expect(e.message).toMatch('The userId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: WIPED_ID }
  await expectSuccess(wipeUser(arg, context))
})

test('caller must be authenticated as a moderator', async () => {
  const args = makeArgs(WIPED_ID)
  await auth.createUser({ uid: WIPED_ID })
  await insertUser(db, WIPED_ID)
  
  let context = makeCallableContext(null)
  let e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, false)
  e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, false)
  e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, true)
  e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('The user must be a moderator.')
  expect(e.code).toBe('permission-denied')
  
  context = makeModeratorContext(MODERATOR_ID)
  await expectSuccess(wipeUser(args, context))
})

test('cannot wipe a user that does not exist', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  
  const e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('The user to be banned does not exist.')
  expect(e.code).toBe('not-found')
})

test('moderators cannot wipe themselves', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(MODERATOR_ID)
  await auth.createUser({ uid: MODERATOR_ID })
  const user = await insertUser(db, MODERATOR_ID)
  const variant = await insertVariant(db, 'variant_id', 'white', MODERATOR_ID)
  // TODO: Check reports
  
  const e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('Please do not ban yourself :(')
  expect(e.code).toBe('invalid-argument')
  
  // User data is not changed
  const userAfter = await db.collection('users').doc(MODERATOR_ID).get()
  expect(userAfter.data()).toEqual(user)
  const variantAfter = await db.collection('variants').doc('variant_id').get()
  expect(variantAfter.data()).toEqual(variant)
})

test('moderators cannot wipe another moderator', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(WIPED_ID)
  await auth.createUser({
    uid: WIPED_ID,
    displayName: 'The Wiped User',
    photoURL: 'https://example.com/wiped-user.png',
  })
  await auth.setCustomUserClaims(WIPED_ID, { moderator: true })
  await insertUser(db, WIPED_ID)
  const variant = await insertVariant(db, 'variant_id', 'white', WIPED_ID)
  // TODO: Check reports
  
  const e = await expectHttpsError(wipeUser(args, context))
  expect(e.message).toMatch('You cannot ban moderators directly. Please demote them first.')
  expect(e.code).toBe('invalid-argument')
  
  const variantAfter = await db.collection('variants').doc('variant_id').get()
  expect(variantAfter.data()).toEqual(variant)
})
