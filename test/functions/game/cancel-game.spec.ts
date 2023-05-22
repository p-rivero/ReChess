import { expectHttpsError } from '../utils'
import { fnTest, functions, initialize } from '../init'
import type { https } from 'firebase-functions'
import type { GameDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'

const admin = initialize('cancel-game-test')
const db = admin.firestore()
const cancelGame = fnTest.wrap(functions.cancelGame)

function dummyContext(appCheck = true, auth = true, emailVerified = true): https.CallableContext {
  const token = {
    aud: 'test',
    auth_time: 123,
    email_verified: emailVerified,
    exp: 123,
    firebase: {
      identities: {},
      sign_in_provider: 'test',
    },
    iat: 123,
    iss: 'test',
    sub: 'test',
    uid: 'test',
  }
  return {
    auth: auth ? {
      uid: 'test',
      token,
    } : undefined,
    app: appCheck ? {
      appId: 'rechess-web',
      token,
      alreadyConsumed: false,
    } : undefined,
    rawRequest: 'test',
  } as unknown as https.CallableContext
}

function makeArgs(gameId = '1234', reason = 'a cancel reason') {
  return { gameId, reason }
}


async function createGame(gameId = '1234') {
  const doc: GameDoc = {
    moveHistory: '',
    playerToMove: 'white',
    winner: null,
    IMMUTABLE: {
      players: ['whiteName', 'blackName'],
      timeCreated: admin.firestore.Timestamp.now() as Timestamp,
      variantId: 'standard',
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
}

test('arguments must be correct', async () => {
  const context = dummyContext()
  
  let arg = {}
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called with a gameId and reason.')
  
  arg = { gameId: '1234' }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called with a gameId and reason.')
  
  arg = { reason: 'a cancel reason' }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called with a gameId and reason.')
  
  arg = { gameId: 1234, reason: 'a cancel reason' }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The gameId must be a string.')
  
  arg = { gameId: '1234', reason: 1234 }
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The reason must be a string.')
})

test('user must be authenticated to cancel a game', async () => {
  const arg = makeArgs()
  
  let context = dummyContext(false, true, true)
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called from an App Check verified app.')
  
  context = dummyContext(true, false, true)
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The function must be called while authenticated.')
  
  context = dummyContext(true, true, false)
  e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The email is not verified.')
})

test('cannot cancel a game that does not exist', async () => {
  const context = dummyContext()
  const arg = makeArgs()
  
  let e = await expectHttpsError(cancelGame(arg, context))
  expect(e.message).toMatch('The game does not exist.')
  
  // TODO: Create a game
})
