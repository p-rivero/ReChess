import { functions, initialize } from '../init'
import { expectNoErrorLog } from '../utils'
import { makeFirestoreContext } from '../make-context'
import { insertVariantReport, insertUser } from '../user/user-mock'
import admin from 'firebase-admin'
import { insertVariant } from './variant-mock'

const { app, testEnv } = initialize('report-variant-test')
const db = app.firestore()
const auth = app.auth()
const reportVariant = testEnv.wrap(functions.reportVariant)

const REPORTER_ID = 'user_that_reports'
const REPORTED_VARIANT = 'reported_variant_id'

function makeContext(reporter = REPORTER_ID, reported = REPORTED_VARIANT) {
  return makeFirestoreContext({ userId: reporter, variantId: reported })
}

test('user can report a variant', async () => {
  const reporter = await auth.createUser({
    uid: REPORTER_ID,
    displayName: 'The Reporter',
  })
  const reporterDoc = await insertUser(db, reporter)
  await insertVariant(db, REPORTED_VARIANT)
  const snap = await insertVariantReport(db, testEnv, REPORTER_ID, REPORTED_VARIANT)
  
  const done = expectNoErrorLog()
  await reportVariant(snap, makeContext())
  done()
  
  const reportDoc = await db.doc(`users/${REPORTER_ID}/reportedVariants/${REPORTED_VARIANT}`).get()
  expect(reportDoc.exists).toBe(true)
  expect(reportDoc.data()).toEqual({
    reason: 'Some reason',
    onlyBlock: false,
    time: snap.data()?.time,
  })
  
  const modDoc = await db.doc(`variantModeration/${REPORTED_VARIANT}`).get()
  expect(modDoc.exists).toBe(true)
  const reportTime = reportDoc.data()?.time as admin.firestore.Timestamp
  expect(modDoc.data()).toEqual({
    numReports: 1,
    reportsSummary: `${reporterDoc.IMMUTABLE.username}\tSome reason\t${reportTime.toMillis()}\n`,
  })
  
  const reporterCache = await db.collection('users').doc(REPORTER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: '',
    reportedVariants: ` ${REPORTED_VARIANT}`,
    upvotedVariants: '',
  })
})

test('2 users can report a variant', async () => {
  const reporter1 = await auth.createUser({
    uid: REPORTER_ID,
    displayName: 'The Reporter',
  })
  const reporterDoc1 = await insertUser(db, reporter1)
  const reporter2 = await auth.createUser({
    uid: 'another_reporter',
    displayName: 'Another Reporter',
  })
  const reporterDoc2 = await insertUser(db, reporter2)
  
  const snap1 = await insertVariantReport(db, testEnv, REPORTER_ID, REPORTED_VARIANT)
  const snap2 = await insertVariantReport(db, testEnv, 'another_reporter', REPORTED_VARIANT)
  const done = expectNoErrorLog()
  await reportVariant(snap1, makeContext())
  await reportVariant(snap2, makeContext('another_reporter'))
  done()
  
  const reportDoc1 = await db.doc(`users/${REPORTER_ID}/reportedVariants/${REPORTED_VARIANT}`).get()
  expect(reportDoc1.exists).toBe(true)
  const reportDoc2 = await db.doc(`users/another_reporter/reportedVariants/${REPORTED_VARIANT}`).get()
  expect(reportDoc2.exists).toBe(true)
  
  
  const modDoc = await db.doc(`variantModeration/${REPORTED_VARIANT}`).get()
  expect(modDoc.exists).toBe(true)
  const reportTime1 = reportDoc1.data()?.time as admin.firestore.Timestamp
  const reportTime2 = reportDoc2.data()?.time as admin.firestore.Timestamp
  expect(modDoc.data()).toEqual({
    numReports: 2,
    reportsSummary: `${reporterDoc1.IMMUTABLE.username}\tSome reason\t${reportTime1.toMillis()}\n` +
      `${reporterDoc2.IMMUTABLE.username}\tSome reason\t${reportTime2.toMillis()}\n`,
  })
})

test('user can report 2 variants', async () => {
  const reporter = await auth.createUser({
    uid: REPORTER_ID,
    displayName: 'The Reporter',
  })
  await insertUser(db, reporter)
  await insertVariant(db, REPORTED_VARIANT)
  await insertVariant(db, 'another_reported')
  
  const snap1 = await insertVariantReport(db, testEnv, REPORTER_ID, REPORTED_VARIANT)
  const snap2 = await insertVariantReport(db, testEnv, REPORTER_ID, 'another_reported')
  const done = expectNoErrorLog()
  await reportVariant(snap1, makeContext())
  await reportVariant(snap2, makeContext(REPORTER_ID, 'another_reported'))
  done()
  
  const reportDoc = await db.doc(`users/${REPORTER_ID}/reportedVariants/${REPORTED_VARIANT}`).get()
  expect(reportDoc.data()).toEqual({
    reason: 'Some reason',
    onlyBlock: false,
    time: snap1.data()?.time,
  })
  const reportDoc2 = await db.doc(`users/${REPORTER_ID}/reportedVariants/another_reported`).get()
  expect(reportDoc2.data()).toEqual({
    reason: 'Some reason',
    onlyBlock: false,
    time: snap2.data()?.time,
  })
  
  const reporterCache = await db.collection('users').doc(REPORTER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: '',
    reportedVariants: ` ${REPORTED_VARIANT} another_reported`,
    upvotedVariants: '',
  })
})

// The database rules already check that:
// - users cannot block variants
// - users cannot report the same variant twice
// - users cannot report a variant that does not exist
