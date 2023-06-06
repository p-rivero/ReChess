import { expectHttpsError, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeCallableContext as makeContext } from '../make-context'
import { insertGame } from './games-mock'
import admin from 'firebase-admin'
import type { Timestamp } from 'firebase/firestore'

const { app, testEnv } = initialize('cancel-game-test')
const db = app.firestore()
const cancelGame = testEnv.wrap(functions.cancelGame)

const VARIANT_ID = 'some_variant_id'
const GAME_ID = 'some_game_id'

function makeArgs(gameId = GAME_ID, reason = 'a cancel reason') {
  return { gameId, reason }
}

test('white player can cancel a game', async () => {
  const context = makeContext('white_id')
  const arg = makeArgs(GAME_ID, 'the other player is a cheater')
  const insertedDoc = await insertGame(db, GAME_ID, VARIANT_ID)
  
  const startTime = admin.firestore.Timestamp.now()
  
  await expectSuccess(cancelGame(arg, context))
  
  const oldGameLocation = await db.collection('games').doc(arg.gameId).get()
  expect(oldGameLocation.exists).toBe(false)
  
  const cancelledGame = await db.collection('cancelledGames').doc(arg.gameId).get()
  expect(cancelledGame.exists).toBe(true)
  expect(cancelledGame.data()).toEqual({
    ...insertedDoc,
    cancelledByUserId: 'white_id',
    cancelReason: 'the other player is a cheater',
    cancelTime: expect.anything(),
  })
  
  const endTime = admin.firestore.Timestamp.now()
  const cancelTime = cancelledGame.data()!.cancelTime as Timestamp
  expect(cancelTime.valueOf() < endTime.valueOf()).toBe(true)
  expect(cancelTime.valueOf() > startTime.valueOf()).toBe(true)
})

test('black player can cancel a game', async () => {
  const context = makeContext('black_id')
  const arg = makeArgs(GAME_ID, 'illegal move detected')
  const insertedDoc = await insertGame(db, GAME_ID, VARIANT_ID)
  
  const startTime = admin.firestore.Timestamp.now()
  
  await expectSuccess(cancelGame(arg, context))
  
  const oldGame = await db.collection('games').doc(arg.gameId).get()
  expect(oldGame.exists).toBe(false)
  
  const cancelledGame = await db.collection('cancelledGames').doc(arg.gameId).get()
  expect(cancelledGame.exists).toBe(true)
  expect(cancelledGame.data()).toEqual({
    ...insertedDoc,
    cancelledByUserId: 'black_id',
    cancelReason: 'illegal move detected',
    cancelTime: expect.anything(),
  })
  
  const endTime = admin.firestore.Timestamp.now()
  const cancelTime = cancelledGame.data()!.cancelTime as Timestamp
  expect(cancelTime.valueOf() < endTime.valueOf()).toBe(true)
  expect(cancelTime.valueOf() > startTime.valueOf()).toBe(true)
})

test('cancelling a game decrements the variant popularity', async () => {
  const context = makeContext('white_id')
  const arg = makeArgs(GAME_ID, 'the other player is a cheater')
  await insertGame(db, GAME_ID, VARIANT_ID)
  const variantBefore = await db.collection('variants').doc(VARIANT_ID).get()
  
  await expectSuccess(cancelGame(arg, context))
  
  const variantAfter = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variantAfter.data()!.popularity).toBe(variantBefore.data()!.popularity - 1)
})


test('arguments must be correct', async () => {
  const context = makeContext('my_id')
  await insertGame(db, GAME_ID, VARIANT_ID)
  
  let arg = {}
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called with a gameId and reason.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { gameId: GAME_ID }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called with a gameId and reason.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { reason: 'a cancel reason' }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called with a gameId and reason.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { gameId: 1234, reason: 'a cancel reason' }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The gameId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { gameId: GAME_ID, reason: 1234 }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The reason must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { gameId: GAME_ID, reason: 'a'.repeat(501) }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The reason must be at most 500 characters.')
  expect(e.code).toBe('invalid-argument')
})

test('user must be authenticated to cancel a game', async () => {
  const arg = makeArgs()
  await insertGame(db, GAME_ID, VARIANT_ID)
  
  let context = makeContext(null)
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeContext('some_id', false)
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeContext('some_id', true, false)
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
})

test('cannot cancel a game that does not exist', async () => {
  const context = makeContext('my_user_id')
  const arg = makeArgs('nonexistent_game_id')
  await insertGame(db, GAME_ID, VARIANT_ID)
  
  const e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The game does not exist.')
  expect(e.code).toBe('not-found')
})

test('caller must be one of the players', async () => {
  let context = makeContext('neither_of_the_players')
  const arg = makeArgs()
  await insertGame(db, GAME_ID, VARIANT_ID)
  
  const e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called by either the white or black player.')
  expect(e.code).toBe('permission-denied')
  
  context = makeContext('white_id')
  await expectSuccess(cancelGame(arg, context))
})
