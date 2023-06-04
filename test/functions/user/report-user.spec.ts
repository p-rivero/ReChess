import { functions, initialize } from '../init'
import { expectNoErrorLog } from '../utils'
import { insertUser, insertUserReport } from './user-mock' 
import { makeFirestoreContext } from '../make-context'
import admin from 'firebase-admin'

const { app, testEnv } = initialize('report-user-test')
const db = app.firestore()
const auth = app.auth()
const reportUser = testEnv.wrap(functions.reportUser)

const REPORTER_ID = 'user_that_reports'
const REPORTED_ID = 'reported_user_id'

function makeContext(reporter = REPORTER_ID, reported = REPORTED_ID) {
  return makeFirestoreContext({ userId: reporter, reportedUserId: reported })
}

test('user can report another user', async () => {
  const reporter = await auth.createUser({
    uid: REPORTER_ID,
    displayName: 'The Reporter',
  })
  const reporterDoc = await insertUser(db, reporter)
  const reported = await auth.createUser({
    uid: REPORTED_ID,
    displayName: 'Reported User',
  })
  await insertUser(db, reported)
  const snap = await insertUserReport(db, testEnv, REPORTER_ID, REPORTED_ID)
  
  const done = expectNoErrorLog()
  await reportUser(snap, makeContext())
  done()
  
  const reportDoc = await db.doc(`users/${REPORTER_ID}/reportedUsers/${REPORTED_ID}`).get()
  expect(reportDoc.exists).toBe(true)
  expect(reportDoc.data()).toEqual({
    reason: 'Some reason',
    onlyBlock: false,
    time: snap.data()?.time,
  })
  
  const modDoc = await db.doc(`userModeration/${REPORTED_ID}`).get()
  expect(modDoc.exists).toBe(true)
  const reportTime = reportDoc.data()?.time as admin.firestore.Timestamp
  expect(modDoc.data()).toEqual({
    numReports: 1,
    reportsSummary: `${reporterDoc.IMMUTABLE.username}\tSome reason\t${reportTime.toMillis()}\n`,
  })
  
  const reporterCache = await db.collection('users').doc(REPORTER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: ` ${REPORTED_ID}`,
    reportedVariants: '',
    upvotedVariants: '',
  })
})

test('user can block another user', async () => {
  const reporter = await auth.createUser({
    uid: REPORTER_ID,
    displayName: 'The Reporter',
  })
  await insertUser(db, reporter)
  const blocked = await auth.createUser({
    uid: REPORTED_ID,
    displayName: 'Blocked User',
  })
  await insertUser(db, blocked)
  const snap = await insertUserReport(db, testEnv, REPORTER_ID, REPORTED_ID, true)
  
  const done = expectNoErrorLog()
  await reportUser(snap, makeContext())
  done()
  
  const reportDoc = await db.doc(`users/${REPORTER_ID}/reportedUsers/${REPORTED_ID}`).get()
  expect(reportDoc.exists).toBe(true)
  expect(reportDoc.data()).toEqual({
    reason: '',
    onlyBlock: true,
    time: snap.data()?.time,
  })
  
  // Report is not created
  const modDoc = await db.doc(`userModeration/${REPORTED_ID}`).get()
  expect(modDoc.exists).toBe(false)
  
  // Private cache is updated as if it was a report
  const reporterCache = await db.collection('users').doc(REPORTER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: ` ${REPORTED_ID}`,
    reportedVariants: '',
    upvotedVariants: '',
  })
})

test('2 users can report a user', async () => {
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
  const reported = await auth.createUser({
    uid: REPORTED_ID,
    displayName: 'Reported User',
  })
  await insertUser(db, reported)
  
  const snap1 = await insertUserReport(db, testEnv, REPORTER_ID, REPORTED_ID)
  const snap2 = await insertUserReport(db, testEnv, 'another_reporter', REPORTED_ID)
  const done = expectNoErrorLog()
  await reportUser(snap1, makeContext())
  await reportUser(snap2, makeContext('another_reporter'))
  done()
  
  const reportDoc1 = await db.doc(`users/${REPORTER_ID}/reportedUsers/${REPORTED_ID}`).get()
  expect(reportDoc1.exists).toBe(true)
  const reportDoc2 = await db.doc(`users/another_reporter/reportedUsers/${REPORTED_ID}`).get()
  expect(reportDoc2.exists).toBe(true)
  
  
  const modDoc = await db.doc(`userModeration/${REPORTED_ID}`).get()
  expect(modDoc.exists).toBe(true)
  const reportTime1 = reportDoc1.data()?.time as admin.firestore.Timestamp
  const reportTime2 = reportDoc2.data()?.time as admin.firestore.Timestamp
  expect(modDoc.data()).toEqual({
    numReports: 2,
    reportsSummary: `${reporterDoc1.IMMUTABLE.username}\tSome reason\t${reportTime1.toMillis()}\n` +
      `${reporterDoc2.IMMUTABLE.username}\tSome reason\t${reportTime2.toMillis()}\n`,
  })
})

test('user can report 2 users', async () => {
  const reporter = await auth.createUser({
    uid: REPORTER_ID,
    displayName: 'The Reporter',
  })
  await insertUser(db, reporter)
  const reported1 = await auth.createUser({
    uid: REPORTED_ID,
    displayName: 'Reported User',
  })
  await insertUser(db, reported1)
  const reported2 = await auth.createUser({
    uid: 'another_reported',
    displayName: 'Reported User 2',
  })
  await insertUser(db, reported2)
  
  const snap1 = await insertUserReport(db, testEnv, REPORTER_ID, REPORTED_ID)
  const snap2 = await insertUserReport(db, testEnv, REPORTER_ID, 'another_reported')
  const done = expectNoErrorLog()
  await reportUser(snap1, makeContext())
  await reportUser(snap2, makeContext(REPORTER_ID, 'another_reported'))
  done()
  
  const reportDoc1 = await db.doc(`users/${REPORTER_ID}/reportedUsers/${REPORTED_ID}`).get()
  expect(reportDoc1.data()).toEqual({
    reason: 'Some reason',
    onlyBlock: false,
    time: snap1.data()?.time,
  })
  const reportDoc2 = await db.doc(`users/${REPORTER_ID}/reportedUsers/another_reported`).get()
  expect(reportDoc2.data()).toEqual({
    reason: 'Some reason',
    onlyBlock: false,
    time: snap2.data()?.time,
  })
  
  const reporterCache = await db.collection('users').doc(REPORTER_ID).collection('privateCache').doc('doc').get()
  expect(reporterCache.exists).toBe(true)
  expect(reporterCache.data()).toEqual({
    reportedUsers: ` ${REPORTED_ID} another_reported`,
    reportedVariants: '',
    upvotedVariants: '',
  })
})

// The database rules already check that:
// - users cannot report themselves
// - users cannot report the same user twice
// - users cannot report a user that does not exist
// - users cannot report a user after blocking them
