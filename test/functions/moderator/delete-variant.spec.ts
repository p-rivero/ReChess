import { expectHttpsError, expectLog, expectNoErrorLog, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeModeratorContext, insertModerationDoc } from './moderator-mock'
import { makeCallableContext } from '../make-context'
import { insertUser } from '../user/user-mock'
import { insertVariant, insertIndex } from '../variant/variant-mock'
import { insertGame, insertLobbySlot } from '../game/games-mock'

const { app, testEnv } = initialize('delete-variant-test')
const db = app.firestore()
const auth = app.auth()
const deleteVariant = testEnv.wrap(functions.deleteVariant)

const MODERATOR_ID = 'moderator_user_id'
const VARIANT_ID = 'deleted_variant_id'

function makeArgs(deletedVariantId: string) {
  return { variantId: deletedVariantId }
}

async function gameOverTriggerExists(gameId: string): Promise<boolean> {
  const doc = await db.collection('games').doc(gameId).collection('gameOverTrigger').doc('doc').get()
  return doc.exists
}

test('moderator can delete a variant', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertVariant(db, 'another_variant', 'white')
  await insertIndex(db, [{ id: VARIANT_ID, name: 'deleted variant' }])
  
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
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
  await insertIndex(db, [{ id: VARIANT_ID, name: 'deleted variant' }])
  
  await insertGame(db, 'game_1', VARIANT_ID, 'draw', true)
  await insertGame(db, 'game_2', VARIANT_ID)
  await insertGame(db, 'game_3', 'another_variant', 'white', true)
  expect(await gameOverTriggerExists('game_1')).toBe(true)
  expect(await gameOverTriggerExists('game_2')).toBe(false)
  expect(await gameOverTriggerExists('game_3')).toBe(true)
  
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
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
  
  expect(await gameOverTriggerExists('game_1')).toBe(false)
  expect(await gameOverTriggerExists('game_2')).toBe(false)
  expect(await gameOverTriggerExists('game_3')).toBe(true)
})

test('moderation document is deleted', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertVariant(db, 'another_variant', 'white')
  await insertIndex(db, [{ id: VARIANT_ID, name: 'deleted variant' }])
  
  await insertModerationDoc(db, 'variant', VARIANT_ID, 10)
  const otherDoc = await insertModerationDoc(db, 'variant', 'another_variant', 4)
  
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const docAfter = await db.collection('variantModeration').doc(VARIANT_ID).get()
  expect(docAfter.exists).toBe(false)
  const otherDocAfter = await db.collection('variantModeration').doc('another_variant').get()
  expect(otherDocAfter.exists).toBe(true)
  expect(otherDocAfter.data()).toEqual(otherDoc)
})

test('variant index is updated', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  
  const index1 = await insertIndex(db, [
    { id: 'aaa', name: 'Variant A', description: 'abc', tags: [] },
    { id: VARIANT_ID, name: 'Variant name', description: 'some description', tags: ['tag1', 'tag2'] },
    { id: 'bbb', name: 'Variant B' },
  ], 123)
  expect(index1).toEqual({ index:
      'aaa\tVariant A\tabc\t\n' +
      VARIANT_ID + '\tVariant name\tsome description\ttag1,tag2\n' +
      'bbb\tVariant B\tThis is the description for Variant B\ttag1,tag2'
  })
  
  const index2 = await insertIndex(db, [{ id: 'ccc', name: 'Variant C' }], 456)
  expect(index2).toEqual({
    index: 'ccc\tVariant C\tThis is the description for Variant C\ttag1,tag2'
  })
  
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const index1After = await db.collection('variantIndex').doc('123').get()
  expect(index1After.data()).toEqual({ index:
    'aaa\tVariant A\tabc\t\n' +
    'bbb\tVariant B\tThis is the description for Variant B\ttag1,tag2'
  })
  const index2After = await db.collection('variantIndex').doc('456').get()
  expect(index2After.data()).toEqual({ index:
    'ccc\tVariant C\tThis is the description for Variant C\ttag1,tag2'
  })
})

test('lobby slots are deleted', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertIndex(db, [{ id: VARIANT_ID, name: 'deleted variant' }])
  
  await insertLobbySlot(db, VARIANT_ID, 'creator_1', 'challenger_id', 'random', true)
  await insertLobbySlot(db, VARIANT_ID, 'creator_2', null, 'white')
  await insertLobbySlot(db, 'another_variant', 'creator_id', null, 'white')
  
  const done = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const slot1 = await db.collection('variants').doc(VARIANT_ID).collection('lobby').doc('creator_1').get()
  expect(slot1.exists).toBe(false)
  const slot2 = await db.collection('variants').doc(VARIANT_ID).collection('lobby').doc('creator_2').get()
  expect(slot2.exists).toBe(false)
  const slot3 = await db.collection('variants').doc('another_variant').collection('lobby').doc('creator_id').get()
  expect(slot3.exists).toBe(true)
})

test('deleting a variant when index does not exist', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  const index = await insertIndex(db, [
    { id: 'another', name: 'Another variant' },
    { id: 'not_this_id', name: 'Variant name' },
  ])
  
  const done = expectLog('error', 'Could not find index entry for ' + VARIANT_ID)
  await expectSuccess(deleteVariant(args, context))
  done()
  
  const indexAfter = await db.collection('variantIndex').doc('0').get()
  expect(indexAfter.data()).toEqual(index)
})

test('deleting a variant that does not exist does nothing', async () => {
  const context = makeModeratorContext(MODERATOR_ID)
  const args = makeArgs(VARIANT_ID)
  await insertVariant(db, 'another_variant', 'white')
  await insertGame(db, 'game_1', 'another_variant', 'draw')
  
  const done = expectLog('error', 'Could not find index entry for ' + VARIANT_ID)
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
  await insertIndex(db, [{ id: VARIANT_ID, name: 'deleted variant' }])
  
  await expectSuccess(deleteVariant(args, context))
  const done = expectLog('error', 'Could not find index entry for ' + VARIANT_ID)
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
  await insertIndex(db, [{ id: VARIANT_ID, name: 'deleted variant' }])
  
  await Promise.all(Array.from({ length: NUM_GAMES }, async (_, i) => {
    await insertGame(db, `game_${i}`, VARIANT_ID)
  }))
  await Promise.all(Array.from({ length: NUM_GAMES }, async (_, i) => {
    const game = await db.collection('games').doc(`game_${i}`).get()
    expect(game.exists).toBe(true)
  }))
  
  const done = expectLog('info', 'Batching 501 documents into 2 batches', 2)
  const done2 = expectNoErrorLog()
  await expectSuccess(deleteVariant(args, context))
  done()
  done2()
  
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
})
