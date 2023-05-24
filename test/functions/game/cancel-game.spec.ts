import { expectHttpsError, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import makeContext from './make-callable-context'
import admin from 'firebase-admin'
import type { GameDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'

const { app, testEnv } = initialize('cancel-game-test')
const db = app.firestore()
const cancelGame = testEnv.wrap(functions.cancelGame)

const GAME_ID = 'some_game_id'

function makeArgs(gameId = GAME_ID, reason = 'a cancel reason') {
  return { gameId, reason }
}

async function insertGame(gameId = GAME_ID) {
  const doc: GameDoc = {
    moveHistory: '',
    playerToMove: 'white',
    winner: null,
    IMMUTABLE: {
      players: ['whiteName', 'blackName'],
      timeCreated: admin.firestore.Timestamp.now() as Timestamp,
      variantId: 'some_variant_id',
      variant: {
        name: 'Standard',
        description: 'Standard chess rules',
        creationTime: admin.firestore.Timestamp.now() as Timestamp,
        creatorDisplayName: 'test',
        creatorId: null,
        numUpvotes: 0,
        popularity: 0,
        tags: [],
        initialState: '{}',
      },
      whiteId: 'whiteId',
      whiteDisplayName: 'whiteName',
      blackId: 'blackId',
      blackDisplayName: 'blackName',
      requestedColor: 'white',
      calledFinishGame: false,
    },
  }
  await db.collection('games').doc(gameId).set(doc)
  return doc
}


test('white player can cancel a game', async () => {
  const context = makeContext('whiteId')
  const arg = makeArgs(GAME_ID, 'the other player is a cheater')
  const insertedDoc = await insertGame()
  
  const startTime = admin.firestore.Timestamp.now()
  
  await expectSuccess(cancelGame(arg, context))
  
  const oldGame = await db.collection('games').doc(arg.gameId).get()
  expect(oldGame.exists).toBe(false)
  
  const cancelledGame = await db.collection('cancelledGames').doc(arg.gameId).get()
  expect(cancelledGame.exists).toBe(true)
  expect(cancelledGame.data()).toEqual({
    ...insertedDoc,
    cancelledByUserId: 'whiteId',
    cancelReason: 'the other player is a cheater',
    cancelTime: expect.anything(),
  })
  
  const endTime = admin.firestore.Timestamp.now()
  const cancelTime = cancelledGame.data()!.cancelTime as Timestamp
  expect(cancelTime.valueOf() < endTime.valueOf()).toBe(true)
  expect(cancelTime.valueOf() > startTime.valueOf()).toBe(true)
})

test('black player can cancel a game', async () => {
  const context = makeContext('blackId')
  const arg = makeArgs(GAME_ID, 'illegal move detected')
  const insertedDoc = await insertGame()
  
  const startTime = admin.firestore.Timestamp.now()
  
  await expectSuccess(cancelGame(arg, context))
  
  const oldGame = await db.collection('games').doc(arg.gameId).get()
  expect(oldGame.exists).toBe(false)
  
  const cancelledGame = await db.collection('cancelledGames').doc(arg.gameId).get()
  expect(cancelledGame.exists).toBe(true)
  expect(cancelledGame.data()).toEqual({
    ...insertedDoc,
    cancelledByUserId: 'blackId',
    cancelReason: 'illegal move detected',
    cancelTime: expect.anything(),
  })
  
  const endTime = admin.firestore.Timestamp.now()
  const cancelTime = cancelledGame.data()!.cancelTime as Timestamp
  expect(cancelTime.valueOf() < endTime.valueOf()).toBe(true)
  expect(cancelTime.valueOf() > startTime.valueOf()).toBe(true)
})


test('arguments must be correct', async () => {
  const context = makeContext()
  await insertGame()
  
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
  await insertGame()
  
  let context = makeContext(false, true, true)
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeContext('some_id', false, true)
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeContext('some_id', true, false)
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
})

test('cannot cancel a game that does not exist', async () => {
  const context = makeContext()
  const arg = makeArgs('nonexistent_game_id')
  await insertGame()
  
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The game does not exist.')
  expect(e.code).toBe('not-found')
})

test('caller must be one of the players', async () => {
  let context = makeContext('not_white_or_black')
  const arg = makeArgs()
  await insertGame()
  
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called by either the white or black player.')
  expect(e.code).toBe('permission-denied')
  
  context = makeContext('whiteId')
  await expectSuccess(cancelGame(arg, context))
})
