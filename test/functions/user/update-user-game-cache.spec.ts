import { functions, initialize } from '../init'
import { expectNoErrorLog } from '../utils'
import { insertUser, changeUserName, insertUserWithGames } from './user-mock' 
import { makeFirestoreContext } from '../make-context'
import { insertVariant } from '../variant/variant-mock'
import { GameSummary } from '@/firebase/db/schema'
import { insertGame } from '../game/games-mock'
import { makeModeratorContext } from '../moderator/moderator-mock'

const { app, testEnv } = initialize('update-user-game-cache-test')
const db = app.firestore()
const auth = app.auth()
const deleteUser = testEnv.wrap(functions.deleteUser)
const renameUser = testEnv.wrap(functions.renameUser)
const deleteVariant = testEnv.wrap(functions.deleteVariant)

const USER_ID = 'the_deleted_user_id'
const VARIANT_ID = 'the_deleted_variant_id'

function changeName(newName: string | null) {
  return changeUserName(db, testEnv, USER_ID, newName)
}
function makeContext() {
  return makeFirestoreContext({ userId: USER_ID })
}


test('name changes propagate to user caches', async () => {
  const myUser = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  await insertUser(db, myUser, true)
  const otherUser = await insertUserWithGames(db, 'other_user', 5)
  const oldCache = JSON.parse(otherUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(oldCache.length).toBe(5)
  
  oldCache[0].opponentId = USER_ID
  oldCache[0].opponentName = 'My Old Name'
  oldCache[2].opponentId = USER_ID
  oldCache[2].opponentName = 'My Old Name'
  
  await db.collection('users').doc('other_user').update({
    'IMMUTABLE.last5Games': JSON.stringify(oldCache),
    'IMMUTABLE.lastGamesOpponentIds': [USER_ID],
  })
  
  const change = await changeName('A New Name')
  
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  
  const myUserAfter = await db.collection('users').doc(myUser.uid).get()
  expect(myUserAfter.data()?.name).toBe('A New Name')
  
  const otherUserAfter = await db.collection('users').doc('other_user').get()
  const newCache = JSON.parse(otherUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(newCache.length).toBe(5)
  expect(newCache[0].opponentId).toBe(USER_ID)
  expect(newCache[0].opponentName).toBe('A New Name')
  expect(newCache[1].opponentId).toBe(oldCache[1].opponentId)
  expect(newCache[1].opponentName).toBe(oldCache[1].opponentName)
  expect(newCache[2].opponentId).toBe(USER_ID)
  expect(newCache[2].opponentName).toBe('A New Name')
  expect(newCache[3].opponentId).toBe(oldCache[3].opponentId)
  expect(newCache[3].opponentName).toBe(oldCache[3].opponentName)
  expect(newCache[4].opponentId).toBe(oldCache[4].opponentId)
  expect(newCache[4].opponentName).toBe(oldCache[4].opponentName)
})

test('other user caches are not affected', async () => {
  const myUser = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  await insertUser(db, myUser, true)
  
  const otherUser = await insertUserWithGames(db, 'other_user', 3)
  const oldCache = JSON.parse(otherUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(oldCache.length).toBe(3)
  
  const notAffectedUser = await insertUserWithGames(db, 'not_affected_user', 5)
  const notAffectedCacheBefore = JSON.parse(notAffectedUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(notAffectedCacheBefore.length).toBe(5)
  
  oldCache[1].opponentId = USER_ID
  oldCache[1].opponentName = 'My Old Name'
  
  await db.collection('users').doc('other_user').update({
    'IMMUTABLE.last5Games': JSON.stringify(oldCache),
    'IMMUTABLE.lastGamesOpponentIds': [USER_ID],
  })
  await db.collection('users').doc('not_affected_user').update({
    // This should never happen, but the function should successfully ignore it
    'IMMUTABLE.lastGamesOpponentIds': [USER_ID],
  })
  
  const change = await changeName('A New Name')
  
  const done = expectNoErrorLog()
  await renameUser(change, makeContext())
  done()
  
  const myUserAfter = await db.collection('users').doc(myUser.uid).get()
  expect(myUserAfter.data()?.name).toBe('A New Name')
  
  const otherUserAfter = await db.collection('users').doc('other_user').get()
  const newCache = JSON.parse(otherUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(newCache.length).toBe(3)
  expect(newCache[0].opponentId).toBe(oldCache[0].opponentId)
  expect(newCache[0].opponentName).toBe(oldCache[0].opponentName)
  expect(newCache[1].opponentId).toBe(USER_ID)
  expect(newCache[1].opponentName).toBe('A New Name')
  expect(newCache[2].opponentId).toBe(oldCache[2].opponentId)
  expect(newCache[2].opponentName).toBe(oldCache[2].opponentName)
  
  const notAffectedUserAfter = await db.collection('users').doc('not_affected_user').get()
  const notAffectedCacheAfter = JSON.parse(notAffectedUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(notAffectedCacheAfter).toEqual(notAffectedCacheBefore)
})


test('deleted users are removed from other caches', async () => {
  const myUser = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  await insertUser(db, myUser, true)
  const otherUser = await insertUserWithGames(db, 'other_user', 5)
  const oldCache = JSON.parse(otherUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(oldCache.length).toBe(5)
  
  oldCache[0].opponentId = USER_ID
  oldCache[0].opponentName = 'My Old Name'
  oldCache[2].opponentId = USER_ID
  oldCache[2].opponentName = 'My Old Name'
  
  await db.collection('users').doc('other_user').update({
    'IMMUTABLE.last5Games': JSON.stringify(oldCache),
    'IMMUTABLE.lastGamesOpponentIds': [USER_ID],
  })
  
  const done = expectNoErrorLog()
  await auth.deleteUser(myUser.uid)
  await deleteUser(myUser)
  done()
  
  const myUserAfter = await db.collection('users').doc(myUser.uid).get()
  expect(myUserAfter.exists).toBe(false)
  
  const otherUserAfter = await db.collection('users').doc('other_user').get()
  const newCache = JSON.parse(otherUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(newCache.length).toBe(5)
  expect(newCache[0].opponentId).toBe(null)
  expect(newCache[0].opponentName).toBe('[deleted]')
  expect(newCache[1].opponentId).toBe(oldCache[1].opponentId)
  expect(newCache[1].opponentName).toBe(oldCache[1].opponentName)
  expect(newCache[2].opponentId).toBe(null)
  expect(newCache[2].opponentName).toBe('[deleted]')
  expect(newCache[3].opponentId).toBe(oldCache[3].opponentId)
  expect(newCache[3].opponentName).toBe(oldCache[3].opponentName)
  expect(newCache[4].opponentId).toBe(oldCache[4].opponentId)
  expect(newCache[4].opponentName).toBe(oldCache[4].opponentName)
})


test('deleted users are removed from other caches', async () => {
  const whitePlayer = await insertUserWithGames(db, 'white_id', 5)
  const blackPlayer = await insertUserWithGames(db, 'black_id', 5)
  const variant = await insertVariant(db, VARIANT_ID)
  
  await insertGame(db, 'not_deleted_2', 'another_variant', 'white', true)
  await insertGame(db, 'deleled_3', VARIANT_ID, 'draw', true)
  await insertGame(db, 'deleled_2', VARIANT_ID, 'white', false)
  
  // This one is not added to the summary, because it's not finished
  await insertGame(db, 'not_deleted_but_unfinished', 'another_variant')
  
  await insertGame(db, 'not_deleted_1', 'another_variant', 'draw', true)
  await insertGame(db, 'deleled_1', VARIANT_ID)
  
  await db.collection('users').doc('white_id').update({
    'IMMUTABLE.lastGamesVariantIds': [VARIANT_ID],
  })
  await db.collection('users').doc('black_id').update({
    'IMMUTABLE.lastGamesVariantIds': [VARIANT_ID],
  })
  
  const context = makeModeratorContext('moderator_id')
  await deleteVariant({ variantId: VARIANT_ID }, context)
  
  
  const whiteUserAfter = await db.collection('users').doc('white_id').get()
  const whiteCache = JSON.parse(whiteUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(whiteCache.length).toBe(2)
  expect(whiteCache[0]).toEqual({
    gameId: 'not_deleted_1',
    variantId: 'another_variant',
    variantName: variant.name,
    timeCreatedMs: expect.anything(),
    playedSide: 'white',
    result: 'draw',
    opponentId: 'black_id',
    opponentName: 'Black Name',
  })
  expect(whiteCache[1]).toEqual({
    gameId: 'not_deleted_2',
    variantId: 'another_variant',
    variantName: variant.name,
    timeCreatedMs: expect.anything(),
    playedSide: 'white',
    result: 'win',
    opponentId: 'black_id',
    opponentName: 'Black Name',
  })
  
  const blackUserAfter = await db.collection('users').doc('black_id').get()
  const blackCache = JSON.parse(blackUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(blackCache.length).toBe(2)
  expect(blackCache[0]).toEqual({
    gameId: 'not_deleted_1',
    variantId: 'another_variant',
    variantName: variant.name,
    timeCreatedMs: expect.anything(),
    playedSide: 'black',
    result: 'draw',
    opponentId: 'white_id',
    opponentName: 'White Name',
  })
  expect(blackCache[1]).toEqual({
    gameId: 'not_deleted_2',
    variantId: 'another_variant',
    variantName: variant.name,
    timeCreatedMs: expect.anything(),
    playedSide: 'black',
    result: 'loss',
    opponentId: 'white_id',
    opponentName: 'White Name',
  })
})
