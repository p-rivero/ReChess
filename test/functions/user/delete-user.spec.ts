import { functions, initialize } from '../init'
import { expectLog, expectNoErrorLog } from '../utils'
import { insertUser, insertUpvote, insertUserReport, insertVariantReport } from './user-mock' 
import { makeFirestoreContext } from '../make-context'
import { insertVariant } from '../variant/variant-mock'
import { insertModerationDoc } from '../moderator/moderator-mock'
import { insertGame } from '../game/games-mock'

const { app, testEnv } = initialize('delete-user-test')
const db = app.firestore()
const bucket = app.storage().bucket()
const auth = app.auth()
const deleteUser = testEnv.wrap(functions.deleteUser)
const incrementVariantUpvotes = testEnv.wrap(functions.incrementVariantUpvotes)
const reportUser = testEnv.wrap(functions.reportUser)
const reportVariant = testEnv.wrap(functions.reportVariant)

const USER_ID = 'the_deleted_user_id'

async function collectionSize(collection: string): Promise<number> {
  const snapshot = await db.collection('users').doc(USER_ID).collection(collection).get()
  return snapshot.size
}
function variantContext(variantId: string) {
  return makeFirestoreContext({ userId: USER_ID, variantId })
}
function reportedUserContext(reportedUserId: string) {
  return makeFirestoreContext({ userId: USER_ID, reportedUserId })
}

test('user docs are deleted when user deletes account', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  const userDoc = await insertUser(db, user, true)
  const username = userDoc.IMMUTABLE.username
  
  const userDocBefore = await db.collection('users').doc(user.uid).get()
  expect(userDocBefore.exists).toBe(true)
  const usernameDocBefore = await db.collection('usernames').doc(username).get()
  expect(usernameDocBefore.exists).toBe(true)
  expect(await collectionSize('private')).toBe(1)
  expect(await collectionSize('renameTrigger')).toBe(1)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const userDocAfter = await db.collection('users').doc(user.uid).get()
  expect(userDocAfter.exists).toBe(false)
  const usernameDocAfter = await db.collection('usernames').doc(username).get()
  expect(usernameDocAfter.exists).toBe(false)
  expect(await collectionSize('private')).toBe(0)
  expect(await collectionSize('renameTrigger')).toBe(0)
})

test('upvotes are deleted' , async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  await insertVariant(db, 'variant_id_1')
  await insertVariant(db, 'variant_id_2')
  const snap1 = await insertUpvote(db, testEnv, USER_ID, 'variant_id_1')
  const snap2 = await insertUpvote(db, testEnv, USER_ID, 'variant_id_2')
  await incrementVariantUpvotes(snap1, variantContext('variant_id_1'))
  await incrementVariantUpvotes(snap2, variantContext('variant_id_2'))
  
  expect(await collectionSize('privateCache')).toBe(1)
  expect(await collectionSize('upvotedVariants')).toBe(2)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  // Don't check that the variant upvotes are decremented, because that's handled by
  // the decrement-variant-upvotes function. When delete-user removes the documents
  // in upvotedVariants, decrement-variant-upvotes is invoked for each variant.
  
  expect(await collectionSize('privateCache')).toBe(0)
  expect(await collectionSize('upvotedVariants')).toBe(0)
})

test('empty private cache is also deleted' , async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  
  await db.collection('users').doc(USER_ID).collection('privateCache').doc('doc').set({
    reportedUsers: '',
    reportedVariants: '',
    upvotedVariants: '',
  })
  
  expect(await collectionSize('privateCache')).toBe(1)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  expect(await collectionSize('privateCache')).toBe(0)
})

test('user reports are deleted', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  const snap1 = await insertUserReport(db, testEnv, USER_ID, 'reported_user')
  const snap2 = await insertUserReport(db, testEnv, USER_ID, 'blocked_user', true)
  await reportUser(snap1, reportedUserContext('reported_user'))
  await reportUser(snap2, reportedUserContext('blocked_user'))
  
  expect(await collectionSize('privateCache')).toBe(1)
  expect(await collectionSize('reportedUsers')).toBe(2)
  
  const reportedDoc = await db.collection('userModeration').doc('reported_user').get()
  expect(reportedDoc.exists).toBe(true)
  const blockedDoc = await db.collection('userModeration').doc('blocked_user').get()
  expect(blockedDoc.exists).toBe(false)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const reportedDocAfter = await db.collection('userModeration').doc('reported_user').get()
  expect(reportedDocAfter.exists).toBe(false)
  
  expect(await collectionSize('privateCache')).toBe(0)
  expect(await collectionSize('reportedUsers')).toBe(0)
})

test('variant reports are deleted', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  await insertVariant(db, 'variant_id_1')
  await insertVariant(db, 'variant_id_2')
  const snap1 = await insertVariantReport(db, testEnv, USER_ID, 'reported_variant_1')
  const snap2 = await insertVariantReport(db, testEnv, USER_ID, 'reported_variant_2')
  await reportVariant(snap1, variantContext('reported_variant_1'))
  await reportVariant(snap2, variantContext('reported_variant_2'))
  
  expect(await collectionSize('privateCache')).toBe(1)
  expect(await collectionSize('reportedVariants')).toBe(2)
  
  const reportedDoc1 = await db.collection('variantModeration').doc('reported_variant_1').get()
  expect(reportedDoc1.exists).toBe(true)
  const reportedDoc2 = await db.collection('variantModeration').doc('reported_variant_2').get()
  expect(reportedDoc2.exists).toBe(true)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const reportedDoc1After = await db.collection('variantModeration').doc('reported_variant_1').get()
  expect(reportedDoc1After.exists).toBe(false)
  const reportedDoc2After = await db.collection('variantModeration').doc('reported_variant_2').get()
  expect(reportedDoc2After.exists).toBe(false)
  
  expect(await collectionSize('privateCache')).toBe(0)
  expect(await collectionSize('reportedVariants')).toBe(0)
})

test('user name is deleted from created variants', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  const myVariant = await insertVariant(db, 'my_variant', 'white', USER_ID)
  const notMyVariant = await insertVariant(db, 'not_my_variant', 'black', 'someone_else')
  
  expect(myVariant.creatorId).toBe(USER_ID)
  expect(notMyVariant.creatorId).toBe('someone_else')
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const myVariantAfter = await db.collection('variants').doc('my_variant').get()
  expect(myVariantAfter.data()).toEqual({
    ...myVariant,
    creatorId: null,
    creatorDisplayName: '[deleted]',
  })
  const notMyVariantAfter = await db.collection('variants').doc('not_my_variant').get()
  expect(notMyVariantAfter.data()).toEqual(notMyVariant)
})

test('user name is deleted from played games', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  const ongoingGame1 = await insertGame(db, 'game_1', 'some_variant')
  await db.collection('games').doc('game_1').update({
    'IMMUTABLE.whiteId': USER_ID,
    'IMMUTABLE.whiteDisplayName': 'The Deleted User',
  })
  const ongoingGame2 = await insertGame(db, 'game_2', 'some_variant')
  await db.collection('games').doc('game_2').update({
    'IMMUTABLE.blackId': USER_ID,
    'IMMUTABLE.blackDisplayName': 'The Deleted User',
  })
  const finishedGame1 = await insertGame(db, 'game_3', 'some_variant', 'draw')
  await db.collection('games').doc('game_3').update({
    'IMMUTABLE.whiteId': USER_ID,
    'IMMUTABLE.whiteDisplayName': 'The Deleted User',
  })
  const finishedGame2 = await insertGame(db, 'game_4', 'some_variant', 'white')
  await db.collection('games').doc('game_4').update({
    'IMMUTABLE.blackId': USER_ID,
    'IMMUTABLE.blackDisplayName': 'The Deleted User',
  })
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const ongoingGame1After = await db.collection('games').doc('game_1').get()
  expect(ongoingGame1After.data()).toEqual({
    ...ongoingGame1,
    playerToMove: 'game-over',
    winner: 'black',
    IMMUTABLE: {
      ...ongoingGame1.IMMUTABLE,
      whiteId: null,
      whiteDisplayName: '[deleted]',
      calledFinishGame: true,
    },
  })
  const ongoingGame2After = await db.collection('games').doc('game_2').get()
  expect(ongoingGame2After.data()).toEqual({
    ...ongoingGame2,
    playerToMove: 'game-over',
    winner: 'white',
    IMMUTABLE: {
      ...ongoingGame2.IMMUTABLE,
      blackId: null,
      blackDisplayName: '[deleted]',
      calledFinishGame: true,
    },
  })
  const finishedGame1After = await db.collection('games').doc('game_3').get()
  expect(finishedGame1After.data()).toEqual({
    ...finishedGame1,
    IMMUTABLE: {
      ...finishedGame1.IMMUTABLE,
      whiteId: null,
      whiteDisplayName: '[deleted]',
    },
  })
  const finishedGame2After = await db.collection('games').doc('game_4').get()
  expect(finishedGame2After.data()).toEqual({
    ...finishedGame2,
    IMMUTABLE: {
      ...finishedGame2.IMMUTABLE,
      blackId: null,
      blackDisplayName: '[deleted]',
    },
  })
})

test('user profile picture is deleted', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user, true)
  await bucket.upload('test/img.png', { destination: `profile-images/${user.uid}`})
  
  const [existsBefore] = await bucket.file(`profile-images/${user.uid}`).exists()
  expect(existsBefore).toBe(true)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const [existsAfter] = await bucket.file(`profile-images/${user.uid}`).exists()
  expect(existsAfter).toBe(false)
})

test('reports of this user are deleted', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user, true)
  await insertModerationDoc(db, 'user', user.uid, 4)
  
  const modDocBefore = await db.collection('userModeration').doc(user.uid).get()
  expect(modDocBefore.exists).toBe(true)
  expect(modDocBefore.data()!.numReports).toBe(4)
  
  const done = expectNoErrorLog()
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  const modDocAfter = await db.collection('userModeration').doc(user.uid).get()
  expect(modDocAfter.exists).toBe(false)
})



test('cannot delete user that does not exist in db', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  
  const done = expectLog('error', `User document for user ${USER_ID} does not exist`)
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
})

test('deleting subcollection with more than 500 documents', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'The Deleted User',
    photoURL: 'https://example.com/user.png',
  })
  await insertUser(db, user)
  
  const batch1 = db.batch()
  const batch2 = db.batch()
  const batch3 = db.batch()
  for (let i = 0; i < 450; i++) {
    const ref = db.collection('users').doc(user.uid).collection('upvotedVariants')
    batch1.set(ref.doc(`variant_a${i}`), { foo: 'bar' })
    batch2.set(ref.doc(`variant_b${i}`), { foo: 'bar' })
    batch3.set(ref.doc(`variant_c${i}`), { foo: 'bar' })
  }
  await batch1.commit()
  await batch2.commit()
  await batch3.commit()
  
  expect(await collectionSize('upvotedVariants')).toBe(1350)
  
  const done = expectLog('info', `Batching 1350 documents into 3 batches`)
  await auth.deleteUser(user.uid)
  await deleteUser(user)
  done()
  
  expect(await collectionSize('upvotedVariants')).toBe(0)
}, 60000)
