import { expectHttpsError, expectLog, expectNoErrorLog, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeModeratorContext } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import { insertUser } from '../user/user-mock'
import type { UserDoc } from '@/firebase/db/schema'
import { insertVariant } from '../variant/variant-mock'
import { insertGame } from '../game/games-mock'

const { app, testEnv } = initialize('delete-variant-test')
const db = app.firestore()
const auth = app.auth()
const deleteVariant = testEnv.wrap(functions.deleteVariant)

const MODERATOR_ID = 'moderator_user_id'
const VARIANT_ID = 'deleted_variant_id'

function makeArgs(deletedVariantId: string) {
  return { variantId: deletedVariantId }
}

test('moderator can delete a variant', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertVariant(db, 'another_variant', 'white')
  
  await expectSuccess(deleteVariant(args, context))
  
  const variant = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variant.exists).toBe(false)
  const otherVariant = await db.collection('variants').doc('another_variant').get()
  expect(otherVariant.exists).toBe(true)
})

test('moderator can delete a variant with games', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertVariant(db, 'another_variant', 'white')
  
  await insertGame(db, 'game_1', VARIANT_ID, 'draw')
  await insertGame(db, 'game_2', VARIANT_ID)
  await insertGame(db, 'game_3', 'another_variant')
  
  await expectSuccess(deleteVariant(args, context))
  
  const variant = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variant.exists).toBe(false)
  const otherVariant = await db.collection('variants').doc('another_variant').get()
  expect(otherVariant.exists).toBe(true)
  
  const game1 = await db.collection('games').doc('game_1').get()
  expect(game1.exists).toBe(false)
  const game2 = await db.collection('games').doc('game_2').get()
  expect(game2.exists).toBe(false)
  const game3 = await db.collection('games').doc('game_3').get()
  expect(game3.exists).toBe(true)
})

test('deleting a variant that does not exist does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, 'another_variant', 'white')
  await insertGame(db, 'game_1', 'another_variant', 'draw')
  
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const otherVariant = await db.collection('variants').doc('another_variant').get()
  expect(otherVariant.exists).toBe(true)
  
  const game1 = await db.collection('games').doc('game_1').get()
  expect(game1.exists).toBe(true)
})

test('deleting a variant twice does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertVariant(db, 'another_variant', 'white')
  await insertGame(db, 'game_1', VARIANT_ID, 'draw')
  
  await expectSuccess(deleteVariant(args, context))
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const variant = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variant.exists).toBe(false)
  const otherVariant = await db.collection('variants').doc('another_variant').get()
  expect(otherVariant.exists).toBe(true)
  
  const game1 = await db.collection('games').doc('game_1').get()
  expect(game1.exists).toBe(false)
})

test('delete a variant with more than 500 games', async () => {
  // This test checks that batchedUpdate() is dividing the work into batches of 500.
  // If it fails, consider increasing the timeout or disabling the test.
  const NUM_GAMES = 501
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  
  await Promise.all(Array.from({ length: NUM_GAMES }, async (_, i) => {
    await insertGame(db, `game_${i}`, VARIANT_ID)
  }))
  await Promise.all(Array.from({ length: NUM_GAMES }, async (_, i) => {
    const game = await db.collection('games').doc(`game_${i}`).get()
    expect(game.exists).toBe(true)
  }))
  
  const done = expectLog('info', 'Batching 501 documents into 2 batches')
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const variant = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variant.exists).toBe(false)
  
  await Promise.all(Array.from({ length: NUM_GAMES }, async (_, i) => {
    const game = await db.collection('games').doc(`game_${i}`).get()
    expect(game.exists).toBe(false)
  }))
}, 60000)



test('arguments must be correct', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  await auth.createUser({ uid: VARIANT_ID })
  await insertUser(db, VARIANT_ID)
  
  let arg = {}
  let e = await expectHttpsError(deleteVariant(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: 123 }
  e = await expectHttpsError(deleteVariant(arg, context))
  expect(e.message).toMatch('The variantId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID }
  await expectSuccess(deleteVariant(arg, context))
})

test('caller must be authenticated as a moderator', async () => {
  const args = makeArgs(VARIANT_ID)
  await auth.createUser({ uid: VARIANT_ID })
  await insertUser(db, VARIANT_ID)
  
  let context = makeCallableContext(null)
  let e = await expectHttpsError(deleteVariant(args, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, false)
  e = await expectHttpsError(deleteVariant(args, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, false)
  e = await expectHttpsError(deleteVariant(args, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeCallableContext(MODERATOR_ID, true, true)
  e = await expectHttpsError(deleteVariant(args, context))
  expect(e.message).toMatch('The user must be a moderator.')
  expect(e.code).toBe('permission-denied')
  
  context = makeModeratorContext(MODERATOR_ID)
  await expectSuccess(deleteVariant(args, context))
})
