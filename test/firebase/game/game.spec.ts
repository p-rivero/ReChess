
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from '../utils'
import { setupJest } from '../init'
import { MY_ID, setupUsersAndVariant, setupGameDoc, setMoveHistory } from './game-test-utils'

let { get, query, set, update, startBatch, now }: TestUtilsSignature = notInitialized()

setupJest('game-tests', env => {
  ({ get, query, set, update, startBatch, now } = setupTestUtils(env, MY_ID, 'my@email.com'))
})

test('anyone can read ongoing and finished games', async () => {
  await setupUsersAndVariant(set)
  const id1 = await setupGameDoc(set, 'alice', 'bob', 'white')
  const id2 = await setupGameDoc(set, 'alice', 'bob', 'game-over')
  
  const snapshot1 = await get('not logged', 'games', id1)
  const snapshot2 = await get('not logged', 'games', id2)
    
  if (!snapshot1.exists()) {
    throw new Error('Document 1 does not exist')
  }
  if (!snapshot2.exists()) {
    throw new Error('Document 2 does not exist')
  }
  expect(snapshot1.data().playerToMove).toBe('white')
  expect(snapshot2.data().playerToMove).toBe('game-over')
  expect(snapshot1.data().winner).toBe(null)
  expect(snapshot2.data().winner).toBe('white')
  expect(snapshot1.data().IMMUTABLE.whiteDisplayName).toBe('Alice')
  expect(snapshot1.data().IMMUTABLE.blackDisplayName).toBe('Bob')
  expect(snapshot1.data().IMMUTABLE.requestedColor).toBe('random')
  
  const queryResult = await query('not logged', 'games')
  expect(queryResult.size).toBe(2)
  expect(queryResult.docs[0].data().IMMUTABLE.whiteDisplayName).toBe('Alice')
})


test('white can make moves', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await setMoveHistory(update, gameId, 'e2e4 e7e5 ', 'white')
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 e7e5 g1f3 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
})

test('black can make moves', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'alice', 'myself', 'white')
  await setMoveHistory(update, gameId, 'e2e4 ', 'black')
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 e7e5 ',
      playerToMove: 'white',
    }, 'games', gameId)
  )
  
  await setMoveHistory(update, gameId, 'e2e4 e7e5 g1f3 ', 'black')
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 e7e5 g1f3 d7d6 ',
      playerToMove: 'white',
    }, 'games', gameId)
  )
})

test('must be authenticated as the player to move', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  
  await assertFails(
    update('unverified', {
      moveHistory: 'e2e4 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 e7e5 ',
      playerToMove: 'white',
    }, 'games', gameId)
  )
})

test('move format must be correct', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4', // missing space
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      moveHistory: 'e200e4', // numbers must be 1 or 2 digits
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4=', // missing promotion
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e20p42=J ', // Correct format, but illegal move. This is detected by the other player.
      playerToMove: 'black',
    }, 'games', gameId)
  )
})

test('must increment history by exactly 1 move', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await setMoveHistory(update, gameId, 'e2e4 e7e5 ', 'white')
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 ', // Removed a move
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 e7e5 ', // No move (skip turn)
      playerToMove: 'black',
    }, 'games', gameId)
  )
  await assertFails(
    update('verified', {
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 e7e5 g1f3 d7d6 ', // Added 2 moves
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 e7e5 g1f3 ', // OK: Added 1 move
      playerToMove: 'black',
    }, 'games', gameId)
  )
})

test('must pass the turn to the other player', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 ',
      playerToMove: 'white', // White moves and wants to move again
    }, 'games', gameId)
  )
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 ',
    }, 'games', gameId)
  )
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 ',
      playerToMove: null,
    }, 'games', gameId)
  )
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
})


test('cannot modify history', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await setMoveHistory(update, gameId, 'e2e4 e7e5 ', 'white')
  
  await assertFails(
    update('verified', {
      moveHistory: 'e2e4 a7a6 g1f3 ', // Replace e7e5 with a7a6
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertSucceeds(
    update('verified', {
      moveHistory: 'e2e4 e7e5 g1f3 ', // OK: Added move without changing previous moves
      playerToMove: 'black',
    }, 'games', gameId)
  )
})

test('cannot modify immutable fields', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await setMoveHistory(update, gameId, 'e2e4 e7e5 ', 'white')
  
  await assertFails(
    update('verified', {
      'IMMUTABLE.whiteDisplayName': 'A new name',
      moveHistory: 'e2e4 e7e5 g1f3 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      'IMMUTABLE.requestedColor': 'white',
      moveHistory: 'e2e4 e7e5 g1f3 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  // This should succeed, since the data is the same as before
  await assertSucceeds(
    update('verified', {
      'IMMUTABLE.requestedColor': 'random',
      moveHistory: 'e2e4 e7e5 g1f3 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
})

test('cannot remove fields', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await setMoveHistory(update, gameId, 'e2e4 e7e5 ', 'white')
  
  await assertFails(
    update('verified', {
      moveHistory: null,
      playerToMove: 'black',
    }, 'games', gameId)
  )
  
  await assertFails(
    update('verified', {
      'IMMUTABLE.requestedColor': null,
      moveHistory: 'e2e4 e7e5 g1f3 ',
      playerToMove: 'black',
    }, 'games', gameId)
  )
})


test('winner must be set if and only if the game is over', async () => {
  await setupUsersAndVariant(set)
  const gameId = await setupGameDoc(set, 'myself', 'bob', 'white')
  await setMoveHistory(update, gameId, 'e2e4 e7e5 ', 'white')
  
  // Set winner and trigger a Game Over (needs to set playerToMove too)
  let batch = startBatch('verified')
  batch.update({
    moveHistory: 'e2e4 e7e5 g1f3 ',
    winner: 'black',
  }, 'games', gameId)
  batch.set({
    gameOverTime: now(),
  }, 'games', gameId, 'gameOverTrigger', 'doc')
  await assertFails(batch.commit())
  
  // Set playerToMove and trigger a Game Over (needs to set winner too)
  batch = startBatch('verified')
  batch.update({
    moveHistory: 'e2e4 e7e5 g1f3 ',
    playerToMove: 'game-over',
  }, 'games', gameId)
  batch.set({
    gameOverTime: now(),
  }, 'games', gameId, 'gameOverTrigger', 'doc')
  await assertFails(batch.commit())
  
  // Set playerToMove and winner, without triggering a Game Over
  batch = startBatch('verified')
  batch.update({
    moveHistory: 'e2e4 e7e5 g1f3 ',
    playerToMove: 'game-over',
    winner: 'black',
  }, 'games', gameId)
  await assertFails(batch.commit())
  
  // Set playerToMove and winner, and trigger a Game Over (OK)
  batch = startBatch('verified')
  batch.update({
    moveHistory: 'e2e4 e7e5 g1f3 ',
    playerToMove: 'game-over',
    winner: 'black',
  }, 'games', gameId)
  batch.set({
    gameOverTime: now(),
  }, 'games', gameId, 'gameOverTrigger', 'doc')
  await assertSucceeds(batch.commit())
})
