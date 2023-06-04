import { functions, initialize } from '../init'
import { expectLog, expectNoErrorLog } from '../utils'
import { makeFirestoreContext } from '../make-context'
import { insertUser, insertUpvote } from '../user/user-mock'
import { insertVariant } from './variant-mock'

const { app, testEnv } = initialize('update-variant-upvotes-test')
const db = app.firestore()
const auth = app.auth()
const incrementVariantUpvotes = testEnv.wrap(functions.incrementVariantUpvotes)
const decrementVariantUpvotes = testEnv.wrap(functions.decrementVariantUpvotes)

const USER_ID = 'upvoter_user_id'
const VARIANT_ID = 'upvoted_variant_id'

function makeContext(userId = USER_ID, variantId = VARIANT_ID) {
  return makeFirestoreContext({ userId, variantId })
}

async function incrementWithSlowStartTime(snap: any, delay: number) {
  await new Promise(resolve => setTimeout(resolve, delay))
  await incrementVariantUpvotes(snap, makeContext())
}


test('can increment variant upvotes', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'Some User',
  })
  await insertUser(db, user)
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = await insertUpvote(db, testEnv, USER_ID, VARIANT_ID)
  
  const done = expectNoErrorLog()
  await incrementVariantUpvotes(snap, makeContext())
  done()
  
  const upvoteDoc = await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).get()
  expect(upvoteDoc.exists).toBe(true)
  expect(upvoteDoc.data()).toEqual({
    time: snap.data()?.time,
  })
  
  const variantDocAfter = await db.doc(`variants/${VARIANT_ID}`).get()
  expect(variantDocAfter.data()).toEqual({
    ...variantDoc,
    numUpvotes: variantDoc.numUpvotes + 1,
  })
  
  const reporterCache = await db.collection('users').doc(USER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.data()).toEqual({
    reportedUsers: '',
    reportedVariants: '',
    upvotedVariants: ` ${VARIANT_ID}`,
  })
})

test('can increment and then decrement variant upvotes', async () => {
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'Some User',
  })
  await insertUser(db, user)
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = await insertUpvote(db, testEnv, USER_ID, VARIANT_ID)
  
  const done = expectNoErrorLog()
  await incrementVariantUpvotes(snap, makeContext())
  await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).delete()
  await decrementVariantUpvotes(snap, makeContext())
  done()
  
  const upvoteDoc = await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).get()
  expect(upvoteDoc.exists).toBe(false)
  
  const variantDocAfter = await db.doc(`variants/${VARIANT_ID}`).get()
  expect(variantDocAfter.data()).toEqual(variantDoc)
  
  const reporterCache = await db.collection('users').doc(USER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.data()).toEqual({
    reportedUsers: '',
    reportedVariants: '',
    upvotedVariants: '',
  })
})

test('calling functions out of order', async () => {
  // Functions can have a slow start time, if a user upvotes a variant and then quickly
  // un-upvotes it, the decrement function could be called before the increment function
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'Some User',
  })
  await insertUser(db, user)
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = await insertUpvote(db, testEnv, USER_ID, VARIANT_ID)
  await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).delete()
  
  const done = expectLog('warn', `Overriding cache! ${USER_ID} ${VARIANT_ID}`)
  await Promise.all([
    decrementVariantUpvotes(snap, makeContext()),
    incrementWithSlowStartTime(snap, 100),
  ])
  done()
  
  const upvoteDoc = await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).get()
  expect(upvoteDoc.exists).toBe(false)
  
  const variantDocAfter = await db.doc(`variants/${VARIANT_ID}`).get()
  expect(variantDocAfter.data()).toEqual({
    ...variantDoc,
    numUpvotes: variantDoc.numUpvotes,
  })
  
  const reporterCache = await db.collection('users').doc(USER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: '',
    reportedVariants: '',
    upvotedVariants: '',
  })
})

test('calling functions out of order (> 1 second)', async () => {
  // The decrementVariantUpvotes function will only wait for 1 second before
  // overriding the cache, so if the increment function is called after that
  // then the cache state will be incorrect.
  // However, the variant upvote count should still be correct.
  const user = await auth.createUser({
    uid: USER_ID,
    displayName: 'Some User',
  })
  await insertUser(db, user)
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = await insertUpvote(db, testEnv, USER_ID, VARIANT_ID)
  await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).delete()
  
  const done = expectLog('warn', `Overriding cache! ${USER_ID} ${VARIANT_ID}`)
  await Promise.all([
    decrementVariantUpvotes(snap, makeContext()),
    incrementWithSlowStartTime(snap, 1500),
  ])
  done()
  
  const upvoteDoc = await db.doc(`users/${USER_ID}/upvotedVariants/${VARIANT_ID}`).get()
  expect(upvoteDoc.exists).toBe(false)
  
  const variantDocAfter = await db.doc(`variants/${VARIANT_ID}`).get()
  expect(variantDocAfter.data()).toEqual({
    ...variantDoc,
    numUpvotes: variantDoc.numUpvotes,
  })
  
  const reporterCache = await db.collection('users').doc(USER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: '',
    reportedVariants: '',
    upvotedVariants: ` ${VARIANT_ID}`, // This should be empty
  })
})
