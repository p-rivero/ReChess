import { expectHttpsError, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { extractReporters, insertModerationDoc, insertReport, makeModeratorContext, REPORT_SUMMARY_REGEX } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import type { ModerationDoc } from '@/firebase/db/schema'
import type { https } from 'firebase-functions'
import { insertUserWithGames } from '../user/user-mock'

const { app, testEnv } = initialize('discard-report-test')
const db = app.firestore()
const discardUserReports = testEnv.wrap(functions.discardUserReports)
const discardVariantReports = testEnv.wrap(functions.discardVariantReports)

const MODERATOR_ID = 'moderator_user_id'
const REPORTED_ID = 'reported_user_id'
const VARIANT_ID = 'reported_variant_id'

function userArgs(userId: string, reporters: string[]) {
  return { userId, reporters }
}
function variantArgs(variantId: string, reporters: string[]) {
  return { variantId, reporters }
}

test('moderator can delete user report', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const modDoc = await insertModerationDoc(db, 'user', REPORTED_ID, 2)
  const reporters = extractReporters(modDoc, 0)
  const args = userArgs(REPORTED_ID, reporters)
  
  await expectSuccess(discardUserReports(args, context))
  
  const moderationDoc = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
  expect(moderationDoc).toEqual({
    numReports: 1,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
})

test('moderator can delete variant report', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const modDoc = await insertModerationDoc(db, 'variant', VARIANT_ID, 2)
  const reporters = extractReporters(modDoc, 0)
  const args = variantArgs(VARIANT_ID, reporters)
  
  await expectSuccess(discardVariantReports(args, context))
  
  const moderationDoc = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDoc).toEqual({
    numReports: 1,
    reportsSummary: expect.stringMatching(REPORT_SUMMARY_REGEX),
  })
})

test('moderator can delete many user reports', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const modDoc =  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  const reporters = extractReporters(modDoc, 0, 2, 4, 6)
  const args = userArgs(REPORTED_ID, reporters)
  
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
  const modDoc = await insertModerationDoc(db, 'variant', VARIANT_ID, 6)
  const reporters = extractReporters(modDoc, 1, 2, 3)
  const args = variantArgs(VARIANT_ID, reporters)
  
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

test('empty reporter list preserves moderationDoc', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  const args = userArgs(REPORTED_ID, []) // empty
  
  const moderationDocBefore = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
    
  await expectSuccess(discardUserReports(args, context))
  
  const moderationDocAfter = (await db.collection('userModeration').doc(REPORTED_ID).get()).data() as ModerationDoc
  expect(moderationDocAfter).toEqual(moderationDocBefore)
})

test('duplicate reporters are ignored', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const modDoc = await insertModerationDoc(db, 'variant', VARIANT_ID, 6)
  const reporters = extractReporters(modDoc, 1, 2, 2, 2, 3, 3)
  expect(reporters.length).toBe(6)
  const args = variantArgs(VARIANT_ID, reporters)
  
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

test('non-existent reporters are ignored', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const modDoc = await insertModerationDoc(db, 'variant', VARIANT_ID, 6)
  const reporters = extractReporters(modDoc, 1, 2).concat('foo', 'bar', 'baz') // foo, bar, baz don't exist
  expect(reporters.length).toBe(5)
  const args = variantArgs(VARIANT_ID, reporters)
  
  const moderationDocBefore = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDocBefore.numReports).toBe(6)
  const reportsBefore = moderationDocBefore.reportsSummary.split('\n')
  expect(reportsBefore.length).toBe(6)
  
  await expectSuccess(discardVariantReports(args, context))
  
  const moderationDoc = (await db.collection('variantModeration').doc(VARIANT_ID).get()).data() as ModerationDoc
  expect(moderationDoc.numReports).toEqual(4)
  const reportsAfter = moderationDoc.reportsSummary.split('\n')
  expect(reportsAfter).toEqual([
    reportsBefore[0],
    reportsBefore[3],
    reportsBefore[4],
    reportsBefore[5],
  ])
})

test('reports are not deleted from the user reports collection', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = userArgs(REPORTED_ID, ['a_reporter'])
  await insertUserWithGames(db, 'a_reporter', 0)
  await insertReport(db, 'a_reporter', 'user', REPORTED_ID)
  await insertReport(db, 'another_reporter', 'user', REPORTED_ID)
  
  const userReportBefore = await db.collection('users').doc('a_reporter')
      .collection('reportedUsers').doc(REPORTED_ID).get()
  expect(userReportBefore.data()).toEqual({
    time: expect.anything(),
    reason: 'The user a_reporter reported the user ' + REPORTED_ID,
    onlyBlock: false,
  })
  
  const moderationDocBefore = await db.collection('userModeration').doc(REPORTED_ID).get()
  expect(moderationDocBefore.data()).toEqual({
    numReports: 2,
    reportsSummary: expect.stringMatching(
      /^a_reporter\tThe user a_reporter reported the user reported_user_id\t\d+\nanother_reporter\tThe user another_reporter reported the user reported_user_id\t\d+$/
    ),
  })
  
  await expectSuccess(discardUserReports(args, context))
  
  const userReportAfter = await db.collection('users').doc('a_reporter')
      .collection('reportedUsers').doc(REPORTED_ID).get()
  expect(userReportAfter.data()).toEqual(userReportBefore.data())
  
  const moderationDocAfter = await db.collection('userModeration').doc(REPORTED_ID).get()
  expect(moderationDocAfter.data()).toEqual({
    numReports: 1,
    reportsSummary: expect.stringMatching(
      /^another_reporter\tThe user another_reporter reported the user reported_user_id\t\d+$/
    ),
  })
})

test('removing all reports deletes the moderation doc', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = userArgs(REPORTED_ID, ['a_reporter'])
  await insertUserWithGames(db, 'a_reporter', 0)
  await insertReport(db, 'a_reporter', 'user', REPORTED_ID)
  
  const moderationDocBefore = await db.collection('userModeration').doc(REPORTED_ID).get()
  expect(moderationDocBefore.data()).toEqual({
    numReports: 1,
    reportsSummary: expect.stringMatching(
      /^a_reporter\tThe user a_reporter reported the user reported_user_id\t\d+$/
    ),
  })
  
  await expectSuccess(discardUserReports(args, context))
  
  const moderationDocAfter = await db.collection('userModeration').doc(REPORTED_ID).get()
  expect(moderationDocAfter.exists).toBe(false)
})



test('user arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await insertModerationDoc(db, 'user', REPORTED_ID, 7)
  
  let arg = {}
  let e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The function must be called with a userId and reporters.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The function must be called with a userId and reporters.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { reporters: [] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The function must be called with a userId and reporters.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: 1234, reporters: [] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The userId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID, reporters: 1234 }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The reporters must be a list of strings.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { userId: REPORTED_ID, reporters: ['a', 'b', 5] }
  e = await expectHttpsError(discardUserReports(arg, context))
  expect(e.message).toMatch('The reporters must be a list of strings.')
  expect(e.code).toBe('invalid-argument')
})

test('variant arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await insertModerationDoc(db, 'variant', VARIANT_ID, 7)
  
  let arg = {}
  let e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and reporters.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and reporters.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { reporters: [] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and reporters.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: 1234, reporters: [] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The variantId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, reporters: 1234 }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The reporters must be a list of strings.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, reporters: ['a', 'b', 5] }
  e = await expectHttpsError(discardVariantReports(arg, context))
  expect(e.message).toMatch('The reporters must be a list of strings.')
  expect(e.code).toBe('invalid-argument')
})

test('caller must be authenticated as a moderator', async () => {
  const userArg = userArgs(REPORTED_ID, ['a', 'b', 'c'])
  const variantArg = variantArgs(VARIANT_ID, ['a', 'b', 'c'])
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

test('removing reports for non-existent moderationDoc does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const userArg = userArgs(REPORTED_ID, ['a', 'b', 'c'])
  const variantArg = variantArgs(VARIANT_ID, ['a', 'b', 'c'])
  
  // Don't throw an error if the moderationDoc doesn't exist, since we want the function to be idempotent.
  await expectSuccess(discardUserReports(userArg, context))
  const userModerationDoc = await db.collection('userModeration').doc(REPORTED_ID).get()
  expect(userModerationDoc.exists).toBe(false)
  
  await expectSuccess(discardVariantReports(variantArg, context))
  const variantModerationDoc = await db.collection('variantModeration').doc(VARIANT_ID).get()
  expect(variantModerationDoc.exists).toBe(false)
})


