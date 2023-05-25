import { expectHttpsError, expectSuccess } from '../utils'
import { functions, initialize } from '../init'
import { makeCallableContext as makeContext } from '../make-context'
import { insertLobbySlot } from './games-mock'
import { insertVariant } from '../variant/variant-mock'
import admin from 'firebase-admin'
import type { Timestamp } from 'firebase/firestore'
import type { LobbySlotDoc } from '@/firebase/db/schema'

const { app, testEnv } = initialize('create-game-test')
const db = app.firestore()
const createGame = testEnv.wrap(functions.createGame)

const USER_ID = 'my_user_id'
const VARIANT_ID = 'some_variant_id'

function makeArgs(variantId = VARIANT_ID, lobbySlotCreatorId = USER_ID) {
  return { variantId, lobbySlotCreatorId }
}


test('a player can create a game', async () => {
  const context = makeContext(USER_ID)
  const arg = makeArgs()
  const startTime = admin.firestore.Timestamp.now()
  const createdVariant = await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'some_challenger_id', 'white')
  
  const { gameId } = await expectSuccess(createGame(arg, context)) as {gameId: string}
  
  const game = await db.collection('games').doc(gameId).get()
  expect(game.exists).toBe(true)
  expect(game.data()).toEqual({
    moveHistory: '',
    playerToMove: 'white',
    winner: null,
    IMMUTABLE: {
      players: [USER_ID, 'some_challenger_id'],
      timeCreated: expect.anything(),
      variantId: VARIANT_ID,
      variant: createdVariant,
      whiteId: USER_ID,
      whiteDisplayName: 'Creator Name',
      blackId: 'some_challenger_id',
      blackDisplayName: 'Challenger Name',
      requestedColor: 'white',
      calledFinishGame: false,
    },
  })
  
  const endTime = admin.firestore.Timestamp.now()
  const gameCreateTime = game.data()!.IMMUTABLE.timeCreated as Timestamp
  expect(gameCreateTime.valueOf() >= startTime.valueOf()).toBe(true)
  expect(gameCreateTime.valueOf() <= endTime.valueOf()).toBe(true)
})

test('variant starting player can be black', async () => {
  const context = makeContext(USER_ID)
  const arg = makeArgs()
  const createdVariant = await insertVariant(db, VARIANT_ID, 'black')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'another_challenger', 'white')
  
  const { gameId } = await expectSuccess(createGame(arg, context)) as {gameId: string}
  
  const game = await db.collection('games').doc(gameId).get()
  expect(game.exists).toBe(true)
  expect(game.data()).toEqual({
    moveHistory: '',
    playerToMove: 'black',
    winner: null,
    IMMUTABLE: {
      players: [USER_ID, 'another_challenger'],
      timeCreated: expect.anything(),
      variantId: VARIANT_ID,
      variant: createdVariant,
      whiteId: USER_ID,
      whiteDisplayName: 'Creator Name',
      blackId: 'another_challenger',
      blackDisplayName: 'Challenger Name',
      requestedColor: 'white',
      calledFinishGame: false,
    },
  })
})

test('slot creator can play as black', async () => {
  const context = makeContext(USER_ID)
  const arg = makeArgs()
  const createdVariant = await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'the_challenger', 'black')
  
  const { gameId } = await expectSuccess(createGame(arg, context)) as {gameId: string}
  
  const game = await db.collection('games').doc(gameId).get()
  expect(game.exists).toBe(true)
  expect(game.data()).toEqual({
    moveHistory: '',
    playerToMove: 'white',
    winner: null,
    IMMUTABLE: {
      players: ['the_challenger', USER_ID],
      timeCreated: expect.anything(),
      variantId: VARIANT_ID,
      variant: createdVariant,
      whiteId: 'the_challenger',
      whiteDisplayName: 'Challenger Name',
      blackId: USER_ID,
      blackDisplayName: 'Creator Name',
      requestedColor: 'black',
      calledFinishGame: false,
    },
  })
})

test('slot creator can play as random side', async () => {
  const context = makeContext(USER_ID)
  const arg = makeArgs()
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'the_challenger', 'random')
  
  const { gameId } = await expectSuccess(createGame(arg, context)) as {gameId: string}
  
  const game = await db.collection('games').doc(gameId).get()
  expect(game.exists).toBe(true)
  // Don't check the game doc, not throwing an error is enough.
  // 50% of the time the slot creator will start as white, 50% as black.
})

test('creating a game increments the variant popularity', async () => {
  const context = makeContext(USER_ID)
  const arg = makeArgs()
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'the_challenger', 'white')
  const variantBefore = await db.collection('variants').doc(VARIANT_ID).get()
  
  await expectSuccess(createGame(arg, context))
  
  const variantAfter = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variantAfter.data()!.popularity).toBe(variantBefore.data()!.popularity + 1)
})

test('creating a game sets the gameDocId of the slot', async () => {
  const context = makeContext(USER_ID)
  const arg = makeArgs()
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'the_challenger', 'white')
  await db.collection('variants').doc(VARIANT_ID).get()
  
  const { gameId } = await expectSuccess(createGame(arg, context)) as {gameId: string}
  
  const slotAfter = await db.collection('variants').doc(VARIANT_ID).collection('lobby').doc(USER_ID).get()
  const slotDoc = slotAfter.data() as LobbySlotDoc
  
  expect(slotDoc.IMMUTABLE.gameDocId).toBe(gameId)
})
  


test('arguments must be correct', async () => {
  const context = makeContext(USER_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'some_challenger_id', 'white')
  
  let arg = {}
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and lobbySlotCreatorId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID }
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and lobbySlotCreatorId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { lobbySlotCreatorId: USER_ID }
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called with a variantId and lobbySlotCreatorId.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: 1234, lobbySlotCreatorId: USER_ID }
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The variantId must be a string.')
  expect(e.code).toBe('invalid-argument')
  
  arg = { variantId: VARIANT_ID, lobbySlotCreatorId: 1234 }
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The lobbySlotCreatorId must be a string.')
  expect(e.code).toBe('invalid-argument')
})

test('user must be authenticated to create a game', async () => {
  const arg = makeArgs()
  await insertVariant(db, VARIANT_ID, 'white')
  
  let context = makeContext(null)
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeContext(USER_ID, false)
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  expect(e.code).toBe('unauthenticated')
  
  context = makeContext(USER_ID, true, false)
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The email is not verified.')
  expect(e.code).toBe('unauthenticated')
})

test('only the slot creator can create the game', async () => {
  const arg = makeArgs()
  await insertVariant(db, VARIANT_ID, 'white')
  
  let context = makeContext('not_the_slot_creator')
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called by the user that created the lobby slot.')
  expect(e.code).toBe('permission-denied')
  
  context = makeContext(USER_ID)
  e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The lobby slot does not exist: variants/some_variant_id/lobby/my_user_id')
  expect(e.code).toBe('failed-precondition')
  
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'a_challenger', 'white')
  await expectSuccess(createGame(arg, context))
})

test('cannot create a game if slot has no challenger', async () => {
  const arg = makeArgs()
  const context = makeContext(USER_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, null, 'white')
  
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The lobby slot has no challenger.')
  expect(e.code).toBe('failed-precondition')
})

test('cannot create a game for a slot that already has a game', async () => {
  const arg = makeArgs()
  const context = makeContext(USER_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'a_challenger', 'white', true)
  
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The lobby slot already has a game.')
  expect(e.code).toBe('failed-precondition')
})

test('cannot create a game for a variant that does not exist', async () => {
  // In practice this will never happen, since it's impossible to create the lobby slot.
  const arg = makeArgs()
  const context = makeContext(USER_ID)
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'a_challenger', 'white')
  
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The variant does not exist.')
  expect(e.code).toBe('not-found')
})

test('challenger cannot create the game', async () => {
  // In practice this will never happen, since it's impossible to create the lobby slot.
  const arg = makeArgs()
  const context = makeContext('challenger_id')
  await insertLobbySlot(db, VARIANT_ID, 'creator_id', 'challenger_id', 'white')
  
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The function must be called by the user that created the lobby slot.')
  expect(e.code).toBe('permission-denied')
})

test('variant must have a valid starting player', async () => {
  const arg = makeArgs()
  const context = makeContext(USER_ID)
  await insertVariant(db, VARIANT_ID, 'invalid-variant')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'a_challenger', 'white')
  
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The variant has an invalid initial state.')
  expect(e.code).toBe('internal')
})

test('cannot create a game twice', async () => {
  const arg = makeArgs()
  const context = makeContext(USER_ID)
  await insertVariant(db, VARIANT_ID, 'white')
  await insertLobbySlot(db, VARIANT_ID, USER_ID, 'a_challenger', 'white')
  
  await expectSuccess(createGame(arg, context))
  let e = await expectHttpsError(createGame(arg, context))
  expect(e.message).toMatch('The lobby slot already has a game.')
  expect(e.code).toBe('failed-precondition')
})
