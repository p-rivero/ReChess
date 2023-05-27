import { expectHttpsError, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { insertModerationDoc, makeModeratorContext, REPORT_SUMMARY_REGEX } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import type { ModerationDoc } from '@/firebase/db/schema'
import type { https } from 'firebase-functions'

const { app, testEnv } = initialize('discard-reports-test')
const db = app.firestore()
const discardUserReports = testEnv.wrap(functions.discardUserReports)
const discardVariantReports = testEnv.wrap(functions.discardVariantReports)

const MODERATOR_ID = 'moderator_user_id'
const REPORTED_ID = 'reported_user_id'
const VARIANT_ID = 'reported_variant_id'

function userArgs(userId: string, reportIndexes: number[]) {
  return { userId, reportIndexes }
}
function variantArgs(variantId: string, reportIndexes: number[]) {
  return { variantId, reportIndexes }
}

test('moderator can delete user report', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = userArgs(REPORTED_ID, [0])
  await insertModerationDoc(db, 'user', REPORTED_ID, 1)
  
  await expectSuccess(discardUserReports(args, context))
  
  const moderationDoc = await db.collection('userModeration').doc(REPORTED_ID).get()
  expect(moderationDoc.data()).toEqual({
    numReports: 0,
    reportsSummary: '',
  })
})

test('moderator can delete variant report', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = variantArgs(VARIANT_ID, [0])
  await insertModerationDoc(db, 'variant', VARIANT_ID, 1)
  
  await expectSuccess(discardVariantReports(args, context))
  
  const moderationDoc = await db.collection('variantModeration').doc(VARIANT_ID).get()
  expect(moderationDoc.data()).toEqual({
    numReports: 0,
    reportsSummary: '',
  })
})

test('moderator can delete many user reports', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = userArgs(REPORTED_ID, [0, 2, 4, 6])
  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  
  const moderationDocBefore = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
  expect(moderationDocBefore).toEqual({
    numReports: 7,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
  const reportsBefore = moderationDocBefore.reportsSummary.split('\n')
  expect(reportsBefore.length).toBe(7)
  
  await expectSuccess(discardUserReports(args, context))
  
  const moderationDoc = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
  expect(moderationDoc).toEqual({
    numReports: 3,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
  const reportsAfter = moderationDoc.reportsSummary.split('\n')
  expect(reportsAfter).toEqual([
    reportsBefore[1],
    reportsBefore[3],
    reportsBefore[5],
  ])
})

test('moderator can delete many variant reports', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = variantArgs(VARIANT_ID, [1, 2, 3])
  await insertModerationDoc(db, 'variant', VARIANT_ID, 6)
  
  const moderationDocBefore = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDocBefore).toEqual({
    numReports: 6,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
  const reportsBefore = moderationDocBefore.reportsSummary.split('\n')
  expect(reportsBefore.length).toBe(6)
  
  await expectSuccess(discardVariantReports(args, context))
  
  const moderationDoc = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDoc).toEqual({
    numReports: 3,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
  const reportsAfter = moderationDoc.reportsSummary.split('\n')
  expect(reportsAfter).toEqual([
    reportsBefore[0],
    reportsBefore[4],
    reportsBefore[5],
  ])
})

test('empty index list preserves moderationDoc', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = userArgs(REPORTED_ID, []) // empty
  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  
  const moderationDocBefore = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
    
  await expectSuccess(discardUserReports(args, context))
  
  const moderationDocAfter = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
  expect(moderationDocAfter).toEqual(moderationDocBefore)
})

test('duplicate indexes are ignored', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = variantArgs(VARIANT_ID, [1, 2, 2, 2, 3, 3])
  await insertModerationDoc(db, 'variant', VARIANT_ID, 6)
  
  const moderationDocBefore = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDocBefore).toEqual({
    numReports: 6,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
  const reportsBefore = moderationDocBefore.reportsSummary.split('\n')
  expect(reportsBefore.length).toBe(6)
  
  await expectSuccess(discardVariantReports(args, context))
  
  const moderationDoc = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDoc.numReports).toEqual(3)
  const reportsAfter = moderationDoc.reportsSummary.split('\n')
  expect(reportsAfter).toEqual([
    reportsBefore[0],
    reportsBefore[4],
    reportsBefore[5],
  ])
})



test('user arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  
  let arg = {}
  let e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The function must be called with a userId and reportIndexes.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The function must be called with a userId and reportIndexes.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { reportIndexes: [] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The function must be called with a userId and reportIndexes.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: 1234, reportIndexes: [] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The userId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID, reportIndexes: 1234 }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The reportIndexes must be a list of numbers.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID, reportIndexes: [1, 2, '3'] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The reportIndexes must be a list of numbers.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID, reportIndexes: [1, 2, -3] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('All indexes must be a positive integer.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID, reportIndexes: [1, 2, 3.5, 4] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('All indexes must be a positive integer.')
  expect(e.code).toBe('invalid-argument')
})

test('variant arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await insertModerationDoc(db, 'variant', VARIANT_ID, 7)
  
  let arg = {}
  let e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and reportIndexes.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and reportIndexes.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { reportIndexes: [] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and reportIndexes.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: 1234, reportIndexes: [] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The variantId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, reportIndexes: 1234 }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The reportIndexes must be a list of numbers.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, reportIndexes: [1, 2, '3'] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The reportIndexes must be a list of numbers.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, reportIndexes: [1, 2, -3] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('All indexes must be a positive integer.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, reportIndexes: [1, 2, 3.5, 4] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('All indexes must be a positive integer.')
  expect(e.code).toBe('invalid-argument')
})

test('caller must be authenticated as a moderator', async () => {
  const userArg = userArgs(REPORTED_ID, [1, 2, 3])
  const variantArg = variantArgs(VARIANT_ID, [1, 2, 3])
  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  await insertModerationDoc(db, 'variant', VARIANT_ID, 7)
  
  async function test(fn: (context: https.CallableContext) => Promise<void>) {
    let context = makeCallableContext(null)
    let e = await expectHttpsError(fn(context))
    expect(e.message).toMatch('The function must be called while authenticated.')
    expect(e.code).toBe('unauthenticated')
    
    context = makeCallableContext('some_user', false)
    e = await expectHttpsError(fn(context))
    expect(e.message).toMatch('The function must be called from an App Check verified app.')
    expect(e.code).toBe('unauthenticated')
    
    context = makeCallableContext('some_user', true, false)
    e = await expectHttpsError(fn(context))
    expect(e.message).toMatch('The email is not verified.')
    expect(e.code).toBe('unauthenticated')
    
    context = makeCallableContext('some_user', true, true)
    e = await expectHttpsError(fn(context))
    expect(e.message).toMatch('The user must be a moderator.')
    expect(e.code).toBe('permission-denied')
    
    context = makeModeratorContext('some_user')
    await expectSuccess(fn(context))
  }
  
  await test(async context => await discardUserReports(userArg, context))
  await test(async context => await discardVariantReports(variantArg, context))
})

test('cannot remove reports for a moderationDoc that does not exist', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const userArg = userArgs(REPORTED_ID, [1, 2, 3])
  const variantArg = variantArgs(VARIANT_ID, [1, 2, 3])
  
  let e = await expectHttpsError(discardUserReports(userArg, context))
  expect(e.message).toMatch('This moderation document does not exist.')
  expect(e.code).toBe('not-found')
  
  e = await expectHttpsError(discardVariantReports(variantArg, context))
  expect(e.message).toMatch('This moderation document does not exist.')
  expect(e.code).toBe('not-found')
})

test('no index can be out of range', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const userArg = userArgs(REPORTED_ID, [0, 1])
  const variantArg = variantArgs(VARIANT_ID, [3])
  await insertModerationDoc(db, 'user', REPORTED_ID, 1)
  await insertModerationDoc(db, 'variant', VARIANT_ID, 2)
  
  let e = await expectHttpsError(discardUserReports(userArg, context))
  expect(e.message).toMatch('Some of the given indexes are out of range.')
  expect(e.code).toBe('invalid-argument')
  
  e = await expectHttpsError(discardVariantReports(variantArg, context))
  expect(e.message).toMatch('Some of the given indexes are out of range.')
  expect(e.code).toBe('invalid-argument')
})

