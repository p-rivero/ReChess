import { functions, initialize } from '../init'
import { makeFirestoreContext } from '../make-context'
import { insertGame } from './games-mock'
import { insertUserWithGames } from '../user/user-mock'
import admin from 'firebase-admin'
import type { GameOverTriggerDoc, VariantDoc, UserDoc, GameDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'
import { expectLog, expectNoErrorLog } from '../utils'

const { app, testEnv } = initialize('finish-game-test')
const db = app.firestore()
const finishGame = testEnv.wrap(functions.finishGame)

const VARIANT_ID = 'some_variant_id'
const GAME_ID = 'some_game_id'

function makeSnap() {
  const doc: GameOverTriggerDoc = { gameOverTime: admin.firestore.Timestamp.now() as Timestamp }
  return testEnv.firestore.makeDocumentSnapshot(doc, `games/${GAME_ID}/gameOverTrigger/doc`)
}
function makeContext() {
  return makeFirestoreContext({ gameId: GAME_ID })
}



test('game finishes and white player wins game', async () => {
  const whiteUserBefore = await insertUserWithGames(db, 'white_id', 0)
  const blackUserBefore = await insertUserWithGames(db, 'black_id', 5)
  const gameBefore = await insertGame(db, GAME_ID, VARIANT_ID, 'white') // white wins
  const variantBefore = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  
  const done = expectNoErrorLog()
  await finishGame(makeSnap(), makeContext())
  done()
  
  const whiteUserAfter = (await db.collection('users').doc('white_id').get()).data() as UserDoc
  const blackUserAfter = (await db.collection('users').doc('black_id').get()).data() as UserDoc
  const gameAfter = (await db.collection('games').doc(GAME_ID).get()).data() as GameDoc
  const variantAfter = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  
  // White profile was updated
  expect(whiteUserAfter).toEqual({
    ...whiteUserBefore,
    IMMUTABLE: {
      ...whiteUserBefore.IMMUTABLE,
      numGamesPlayed: whiteUserBefore.IMMUTABLE.numGamesPlayed + 1,
      numWinPoints: whiteUserBefore.IMMUTABLE.numWinPoints + 1,
      last5Games: expect.any(String),
    },
  })
  const whiteLast5GamesBefore = JSON.parse(whiteUserBefore.IMMUTABLE.last5Games)
  const whiteLast5Games = JSON.parse(whiteUserAfter.IMMUTABLE.last5Games)
  expect(whiteLast5GamesBefore).toHaveLength(0)
  expect(whiteLast5Games).toHaveLength(1)
  expect(whiteLast5Games[0]).toEqual({
    gameId: GAME_ID,
    variantId: VARIANT_ID,
    variantName: 'Variant Name',
    timeCreatedMs: gameBefore.IMMUTABLE.timeCreated.toMillis(),
    playedSide: 'white',
    result: 'win',
    opponentId: 'black_id',
    opponentName: 'Black Name',
  })
  
  // Black profile was updated
  expect(blackUserAfter).toEqual({
    ...blackUserBefore,
    IMMUTABLE: {
      ...blackUserBefore.IMMUTABLE,
      numGamesPlayed: blackUserBefore.IMMUTABLE.numGamesPlayed + 1,
      last5Games: expect.any(String),
    },
  })
  const blackLast5GamesBefore = JSON.parse(blackUserBefore.IMMUTABLE.last5Games)
  const blackLast5Games = JSON.parse(blackUserAfter.IMMUTABLE.last5Games)
  expect(blackLast5GamesBefore).toHaveLength(5)
  expect(blackLast5Games).toHaveLength(5)
  expect(blackLast5Games[0]).toEqual({
    gameId: GAME_ID,
    variantId: VARIANT_ID,
    variantName: 'Variant Name',
    timeCreatedMs: gameBefore.IMMUTABLE.timeCreated.toMillis(),
    playedSide: 'black',
    result: 'loss',
    opponentId: 'white_id',
    opponentName: 'White Name',
  })
  
  // Game was marked as finished
  expect(gameAfter).toEqual({
    ...gameBefore,
    IMMUTABLE: {
      ...gameBefore.IMMUTABLE,
      calledFinishGame: true,
    },
  })
  expect(gameBefore.IMMUTABLE.calledFinishGame).toBe(false)
  
  // Variant popularity was decremented
  expect(variantAfter).toEqual({
    ...variantBefore,
    popularity: variantBefore.popularity - 1,
  })
  
})


test('game finishes and black player wins game', async () => {
  const whiteUserBefore = await insertUserWithGames(db, 'white_id', 0)
  const blackUserBefore = await insertUserWithGames(db, 'black_id', 5)
  const gameBefore = await insertGame(db, GAME_ID, VARIANT_ID, 'black') // Black wins
  const variantBefore = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  
  const done = expectNoErrorLog()
  await finishGame(makeSnap(), makeContext())
  done()
  
  const whiteUserAfter = (await db.collection('users').doc('white_id').get()).data() as UserDoc
  const blackUserAfter = (await db.collection('users').doc('black_id').get()).data() as UserDoc
  const gameAfter = (await db.collection('games').doc(GAME_ID).get()).data() as GameDoc
  const variantAfter = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  
  // White profile was updated
  expect(whiteUserAfter).toEqual({
    ...whiteUserBefore,
    IMMUTABLE: {
      ...whiteUserBefore.IMMUTABLE,
      numGamesPlayed: whiteUserBefore.IMMUTABLE.numGamesPlayed + 1,
      last5Games: expect.any(String),
    },
  })
  const whiteLast5Games = JSON.parse(whiteUserAfter.IMMUTABLE.last5Games)
  expect(whiteLast5Games).toHaveLength(1)
  expect(whiteLast5Games[0]).toEqual({
    gameId: GAME_ID,
    variantId: VARIANT_ID,
    variantName: 'Variant Name',
    timeCreatedMs: gameBefore.IMMUTABLE.timeCreated.toMillis(),
    playedSide: 'white',
    result: 'loss',
    opponentId: 'black_id',
    opponentName: 'Black Name',
  })
  
  // Black profile was updated
  expect(blackUserAfter).toEqual({
    ...blackUserBefore,
    IMMUTABLE: {
      ...blackUserBefore.IMMUTABLE,
      numGamesPlayed: blackUserBefore.IMMUTABLE.numGamesPlayed + 1,
      numWinPoints: blackUserBefore.IMMUTABLE.numWinPoints + 1,
      last5Games: expect.any(String),
    },
  })
  const blackLast5Games = JSON.parse(blackUserAfter.IMMUTABLE.last5Games)
  expect(blackLast5Games).toHaveLength(5)
  expect(blackLast5Games[0]).toEqual({
    gameId: GAME_ID,
    variantId: VARIANT_ID,
    variantName: 'Variant Name',
    timeCreatedMs: gameBefore.IMMUTABLE.timeCreated.toMillis(),
    playedSide: 'black',
    result: 'win',
    opponentId: 'white_id',
    opponentName: 'White Name',
  })
  
  expect(gameAfter.IMMUTABLE.calledFinishGame).toEqual(true)
  expect(variantAfter.popularity).toEqual(variantBefore.popularity - 1)
})


test('game finishes and there is a draw', async () => {
  const whiteUserBefore = await insertUserWithGames(db, 'white_id', 0)
  const blackUserBefore = await insertUserWithGames(db, 'black_id', 5)
  const gameBefore = await insertGame(db, GAME_ID, VARIANT_ID, 'draw')
  const variantBefore = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  
  const done = expectNoErrorLog()
  await finishGame(makeSnap(), makeContext())
  done()
  
  const whiteUserAfter = (await db.collection('users').doc('white_id').get()).data() as UserDoc
  const blackUserAfter = (await db.collection('users').doc('black_id').get()).data() as UserDoc
  const gameAfter = (await db.collection('games').doc(GAME_ID).get()).data() as GameDoc
  const variantAfter = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  
  // White profile was updated
  expect(whiteUserAfter).toEqual({
    ...whiteUserBefore,
    IMMUTABLE: {
      ...whiteUserBefore.IMMUTABLE,
      numGamesPlayed: whiteUserBefore.IMMUTABLE.numGamesPlayed + 1,
      numWinPoints: whiteUserBefore.IMMUTABLE.numWinPoints + 0.5,
      last5Games: expect.any(String),
    },
  })
  const whiteLast5Games = JSON.parse(whiteUserAfter.IMMUTABLE.last5Games)
  expect(whiteLast5Games).toHaveLength(1)
  expect(whiteLast5Games[0]).toEqual({
    gameId: GAME_ID,
    variantId: VARIANT_ID,
    variantName: 'Variant Name',
    timeCreatedMs: gameBefore.IMMUTABLE.timeCreated.toMillis(),
    playedSide: 'white',
    result: 'draw',
    opponentId: 'black_id',
    opponentName: 'Black Name',
  })
  
  // Black profile was updated
  expect(blackUserAfter).toEqual({
    ...blackUserBefore,
    IMMUTABLE: {
      ...blackUserBefore.IMMUTABLE,
      numGamesPlayed: blackUserBefore.IMMUTABLE.numGamesPlayed + 1,
      numWinPoints: blackUserBefore.IMMUTABLE.numWinPoints + 0.5,
      last5Games: expect.any(String),
    },
  })
  const blackLast5Games = JSON.parse(blackUserAfter.IMMUTABLE.last5Games)
  expect(blackLast5Games).toHaveLength(5)
  expect(blackLast5Games[0]).toEqual({
    gameId: GAME_ID,
    variantId: VARIANT_ID,
    variantName: 'Variant Name',
    timeCreatedMs: gameBefore.IMMUTABLE.timeCreated.toMillis(),
    playedSide: 'black',
    result: 'draw',
    opponentId: 'white_id',
    opponentName: 'White Name',
  })
  
  expect(gameAfter.IMMUTABLE.calledFinishGame).toEqual(true)
  expect(variantAfter.popularity).toEqual(variantBefore.popularity - 1)
})


test('game must exist', async () => {
  // This will never happen, since the gameOverTrigger cannot be created without a game
  const whiteUserBefore = await insertUserWithGames(db, 'white_id', 0)
  const blackUserBefore = await insertUserWithGames(db, 'black_id', 5)
  
  const done = expectLog('error', 'Game does not exist: ' + GAME_ID)
  await finishGame(makeSnap(), makeContext())
  done()
  
  const whiteUserAfter = (await db.collection('users').doc('white_id').get()).data() as UserDoc
  const blackUserAfter = (await db.collection('users').doc('black_id').get()).data() as UserDoc
  
  expect(whiteUserAfter).toEqual(whiteUserBefore)
  expect(blackUserAfter).toEqual(blackUserBefore)
})

test('game must have finished', async () => {
  // Firebase security rules prevent this from happening
  const whiteUserBefore = await insertUserWithGames(db, 'white_id', 0)
  const blackUserBefore = await insertUserWithGames(db, 'black_id', 5)
  const gameBefore = await insertGame(db, GAME_ID, VARIANT_ID)
  
  const done = expectLog('error', 'Game is not finished: ' + GAME_ID)
  await finishGame(makeSnap(), makeContext())
  done()
  
  const whiteUserAfter = (await db.collection('users').doc('white_id').get()).data() as UserDoc
  const blackUserAfter = (await db.collection('users').doc('black_id').get()).data() as UserDoc
  const gameAfter = (await db.collection('games').doc(GAME_ID).get()).data() as GameDoc
  
  expect(whiteUserAfter).toEqual(whiteUserBefore)
  expect(blackUserAfter).toEqual(blackUserBefore)
  expect(gameAfter).toEqual(gameBefore)
})

test('game must have finished', async () => {
  // Firebase security rules prevent this from happening
  const whiteUserBefore = await insertUserWithGames(db, 'white_id', 0)
  const blackUserBefore = await insertUserWithGames(db, 'black_id', 5)
  const gameBefore = await insertGame(db, GAME_ID, VARIANT_ID)
  
  const done = expectLog('error', 'Game is not finished: ' + GAME_ID)
  await finishGame(makeSnap(), makeContext())
  done()
  
  const whiteUserAfter = (await db.collection('users').doc('white_id').get()).data() as UserDoc
  const blackUserAfter = (await db.collection('users').doc('black_id').get()).data() as UserDoc
  const gameAfter = (await db.collection('games').doc(GAME_ID).get()).data() as GameDoc
  
  expect(whiteUserAfter).toEqual(whiteUserBefore)
  expect(blackUserAfter).toEqual(blackUserBefore)
  expect(gameAfter).toEqual(gameBefore)
})


test('white user must exist', async () => {
  // Firebase security rules prevent this from happening
  await insertUserWithGames(db, 'black_id', 5)
  await insertGame(db, GAME_ID, VARIANT_ID, 'draw')
  
  const done = expectLog('error', 'Profile does not exist: white_id')
  await finishGame(makeSnap(), makeContext())
  done()
})

test('black user must exist', async () => {
  // Firebase security rules prevent this from happening
  await insertUserWithGames(db, 'white_id', 2)
  await insertGame(db, GAME_ID, VARIANT_ID, 'draw')
  
  const done = expectLog('error', 'Profile does not exist: black_id')
  await finishGame(makeSnap(), makeContext())
  done()
})
