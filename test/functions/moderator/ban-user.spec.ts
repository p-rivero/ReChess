import { expectHttpsError, expectLog, expectNoErrorLog, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeModeratorContext } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import { insertUser } from '../user/user-mock'
import type { UserDoc, GameDoc, VariantDoc, BannedUserDataDoc } from '@/firebase/db/schema'
import { insertGame } from '../game/games-mock'
import { insertVariant } from '../variant/variant-mock'

const { app, testEnv } = initialize('ban-user-test')
const db = app.firestore()
const auth = app.auth()
const banUser = testEnv.wrap(functions.banUser)

const MODERATOR_ID = 'moderator_user_id'
const BANNED_ID = 'banned_user_id'

function makeArgs(bannedUserId: string, doNotBackup?: boolean) {
  return { userId: bannedUserId, doNotBackup }
}

test('moderator can ban a user', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  await auth.createUser({
    uid: BANNED_ID,
    displayName: 'The Banned User',
    photoURL: 'https://example.com/banned-user.png',
  })
  const oldUserDoc = await insertUser(db, BANNED_ID)
  
  await expectSuccess(banUser(args, context))
  
  const newUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const userRecord = await auth.getUser(BANNED_ID)
  
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
  const args = makeArgs(BANNED_ID)
  await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, BANNED_ID)
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
  
  await expectSuccess(banUser(args, context))
  
  const ongoingGameAfter = (await db.collection('games').doc('game_id_ongoing').get()).data() as GameDoc
  const ongoingGameAfter2 = (await db.collection('games').doc('game_id_ongoing_2').get()).data() as GameDoc
  const finishedGameAfter = (await db.collection('games').doc('game_id_finished').get()).data() as GameDoc
  
  expect(ongoingGameAfter).toEqual({
    ...ongoingGameBefore,
    playerToMove: 'game-over',
    winner: 'black', // The other player wins
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
    winner: 'white', // The other player wins
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

test('user name is removed from created variants', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, BANNED_ID)
  const variantBefore = await insertVariant(db, 'variant_id', 'white', BANNED_ID)
  
  await expectSuccess(banUser(args, context))
  
  const variantAfter = (await db.collection('variants').doc('variant_id').get()).data() as VariantDoc
  
  expect(variantAfter).toEqual({
    ...variantBefore,
    creatorId: null,
    creatorDisplayName: '[deleted]',
  })
})

test('banning a user twice does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  await auth.createUser({
    uid: BANNED_ID,
    displayName: 'The Banned User',
    photoURL: 'https://example.com/banned-user.png',
  })
  await insertUser(db, BANNED_ID)
  
  await expectSuccess(banUser(args, context))
  const newUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const newUserRecord = await auth.getUser(BANNED_ID)
  
  const done = expectLog('warn', 'The user is already banned: banned_user_id')
  await expectSuccess(banUser(args, context))
  done()
  const veryNewUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const veryNewUserRecord = await auth.getUser(BANNED_ID)
  
  expect(newUserDoc).toEqual(veryNewUserDoc)
  expect(newUserRecord).toEqual(veryNewUserRecord)
})

test('banned user data is stored', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  await auth.createUser({ uid: BANNED_ID })
  const oldUserDoc = await insertUser(db, BANNED_ID)
  await db.collection('users').doc(BANNED_ID).update({
    name: 'The Banned User',
    about: 'I am a banned user.',
    profileImg: 'https://example.com/banned-user.png',
  })
  await insertVariant(db, 'variant_1', 'white', BANNED_ID)
  await insertVariant(db, 'variant_2', 'white', BANNED_ID)
  
  await expectSuccess(banUser(args, context))
  
  const newUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const bannedUserData = (await db.collection('bannedUserData').doc(BANNED_ID).get()).data() as BannedUserDataDoc
  
  expect(newUserDoc).toEqual({
    name: '[deleted]',
    about: '',
    profileImg: null,
    banned: true,
    IMMUTABLE: oldUserDoc.IMMUTABLE,
  })
  expect(bannedUserData).toEqual({
    name: 'The Banned User',
    about: 'I am a banned user.',
    profileImg: 'https://example.com/banned-user.png',
    publishedVariants: 'variant_1 variant_2',
    gamesAsWhite: '',
    gamesAsBlack: '',
  })
})

test('banned user games are stored', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID, false)
  await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, BANNED_ID)
  await db.collection('users').doc(BANNED_ID).update({
    name: 'The Banned User',
    about: 'I am a banned user.',
    profileImg: 'https://example.com/banned-user.png',
  })
  await insertGame(db, 'game_id_ongoing', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing').update({ 
    'IMMUTABLE.whiteId': BANNED_ID,
    'IMMUTABLE.whiteDisplayName': 'The Banned User',
  })
  await insertGame(db, 'game_id_ongoing_2', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing_2').update({ 
    'IMMUTABLE.blackId': BANNED_ID,
    'IMMUTABLE.blackDisplayName': 'The Banned User',
  })
  await insertGame(db, 'game_id_finished', 'some_variant_id', 'white')
  await db.collection('games').doc('game_id_finished').update({
    'IMMUTABLE.blackId': BANNED_ID,
    'IMMUTABLE.blackDisplayName': 'The Banned User',
  })
  await insertGame(db, 'another_game_without_this_player', 'some_variant_id', 'white')
  
  await expectSuccess(banUser(args, context))
  const bannedUserData = (await db.collection('bannedUserData').doc(BANNED_ID).get()).data() as BannedUserDataDoc
  
  expect(bannedUserData).toEqual({
    name: 'The Banned User',
    about: 'I am a banned user.',
    profileImg: 'https://example.com/banned-user.png',
    publishedVariants: '',
    gamesAsWhite: 'game_id_ongoing',
    gamesAsBlack: 'game_id_finished game_id_ongoing_2',
  })
})

test('banned user data is not stored if doNotBackup is set', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID, true)
  await auth.createUser({ uid: BANNED_ID })
  const oldUserDoc = await insertUser(db, BANNED_ID)
  await db.collection('users').doc(BANNED_ID).update({
    name: 'The Banned User',
    about: 'I am a banned user.',
    profileImg: 'https://example.com/banned-user.png',
  })
  await insertVariant(db, 'variant_1', 'white', BANNED_ID)
  await insertGame(db, 'game_id_ongoing', 'some_variant_id')
  await db.collection('games').doc('game_id_ongoing').update({ 
    'IMMUTABLE.whiteId': BANNED_ID,
    'IMMUTABLE.whiteDisplayName': 'The Banned User',
  })
  
  await expectSuccess(banUser(args, context))
  
  const newUserDoc = (await db.collection('users').doc(BANNED_ID).get()).data() as UserDoc
  const bannedUserData = await db.collection('bannedUserData').doc(BANNED_ID).get()
  
  expect(newUserDoc).toEqual({
    name: '[deleted]',
    about: '',
    profileImg: null,
    banned: true,
    IMMUTABLE: oldUserDoc.IMMUTABLE,
  })
  expect(bannedUserData.exists).toEqual(false)
})



test('arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, BANNED_ID)
  
  let arg = {}
  let e = await expectHttpsError(banUser(arg, context))
  expect(e.message).toMatch('The function must be called with a userId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: 123 }
  e = await expectHttpsError(banUser(arg, context))
  expect(e.message).toMatch('The userId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: BANNED_ID, doNotBackup: 123 }
  e = await expectHttpsError(banUser(arg, context))
  expect(e.message).toMatch('The doNotBackup parameter must be a boolean.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: BANNED_ID }
  await expectSuccess(banUser(arg, context))
  
  arg = { userId: BANNED_ID, doNotBackup: true }
  const done = expectLog('warn', 'The user is already banned: banned_user_id')
  await expectSuccess(banUser(arg, context))
  done()
})

test('caller must be authenticated as a moderator', async () => {
  const args = makeArgs(BANNED_ID)
  await auth.createUser({ uid: BANNED_ID })
  await insertUser(db, BANNED_ID)
  
  let context = makeCallableContext(null)
  let e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, false)
  e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, false)
  e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, true)
  e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('The user must be a moderator.')
  expect(e.code).toBe('permission-denied')
  
  context = makeModeratorContext(MODERATOR_ID)
  await expectSuccess(banUser(args, context))
})

test('cannot ban a user that does not exist', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  
  const e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('The user to be banned does not exist.')
  expect(e.code).toBe('not-found')
})

test('moderators cannot ban themselves', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(MODERATOR_ID)
  await auth.createUser({ uid: MODERATOR_ID })
  await insertUser(db, MODERATOR_ID)
  
  const e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('Please do not ban yourself :(')
  expect(e.code).toBe('invalid-argument')
})

test('moderators cannot ban another moderator', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(BANNED_ID)
  await auth.createUser({
    uid: BANNED_ID,
    displayName: 'The Banned User',
    photoURL: 'https://example.com/banned-user.png',
  })
  await auth.setCustomUserClaims(BANNED_ID, { moderator: true })
  await insertUser(db, BANNED_ID)
  
  const e = await expectHttpsError(banUser(args, context))
  expect(e.message).toMatch('You cannot ban moderators directly. Please demote them first.')
  expect(e.code).toBe('invalid-argument')
})
