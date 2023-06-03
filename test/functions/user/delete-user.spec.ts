import { functions, initialize } from '../init'
import { expectLog, expectNoErrorLog } from '../utils'
import { insertUser, insertUpvote, insertUserReport, insertVariantReport } from './user-mock' 
import { makeFirestoreContext } from '../make-context'
import { insertVariant } from '../variant/variant-mock'
import { insertModerationDoc } from '../moderator/moderator-mock'

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
  await insertVariant(db, 'variant_id_1', 'white')
  await insertVariant(db, 'variant_id_2', 'white')
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
  // TODO
})

test('user name is deleted from played games', async () => {
  // TODO
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
  
  // Insert 1350 documents into upvotedVariants
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
})
