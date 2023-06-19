import { functions, initialize } from '../init'
import { expectLog, expectNoErrorLog } from '../utils'
import { insertUser, changeUserName, insertUserWithGames } from './user-mock' 
import { makeFirestoreContext } from '../make-context'
import { insertVariant } from '../variant/variant-mock'
import { GameSummary } from '@/firebase/db/schema'

const { app, testEnv } = initialize('update-user-game-cache-test')
const db = app.firestore()
const auth = app.auth()
const deleteUser = testEnv.wrap(functions.deleteUser)
const renameUser = testEnv.wrap(functions.renameUser)

const USER_ID = 'the_deleted_user_id'

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
  expect(oldCache.length).toEqual(5)
  
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
  expect(myUserAfter.data()?.name).toEqual('A New Name')
  
  const otherUserAfter = await db.collection('users').doc('other_user').get()
  const newCache = JSON.parse(otherUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(newCache.length).toEqual(5)
  expect(newCache[0].opponentId).toEqual(USER_ID)
  expect(newCache[0].opponentName).toEqual('A New Name')
  expect(newCache[1].opponentId).toEqual(oldCache[1].opponentId)
  expect(newCache[1].opponentName).toEqual(oldCache[1].opponentName)
  expect(newCache[2].opponentId).toEqual(USER_ID)
  expect(newCache[2].opponentName).toEqual('A New Name')
  expect(newCache[3].opponentId).toEqual(oldCache[3].opponentId)
  expect(newCache[3].opponentName).toEqual(oldCache[3].opponentName)
  expect(newCache[4].opponentId).toEqual(oldCache[4].opponentId)
  expect(newCache[4].opponentName).toEqual(oldCache[4].opponentName)
})

test('other user caches are not affected', async () => {
  const myUser = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  await insertUser(db, myUser, true)
  
  const otherUser = await insertUserWithGames(db, 'other_user', 3)
  const oldCache = JSON.parse(otherUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(oldCache.length).toEqual(3)
  
  const notAffectedUser = await insertUserWithGames(db, 'not_affected_user', 5)
  const notAffectedCacheBefore = JSON.parse(notAffectedUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(notAffectedCacheBefore.length).toEqual(5)
  
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
  expect(myUserAfter.data()?.name).toEqual('A New Name')
  
  const otherUserAfter = await db.collection('users').doc('other_user').get()
  const newCache = JSON.parse(otherUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(newCache.length).toEqual(3)
  expect(newCache[0].opponentId).toEqual(oldCache[0].opponentId)
  expect(newCache[0].opponentName).toEqual(oldCache[0].opponentName)
  expect(newCache[1].opponentId).toEqual(USER_ID)
  expect(newCache[1].opponentName).toEqual('A New Name')
  expect(newCache[2].opponentId).toEqual(oldCache[2].opponentId)
  expect(newCache[2].opponentName).toEqual(oldCache[2].opponentName)
  
  const notAffectedUserAfter = await db.collection('users').doc('not_affected_user').get()
  const notAffectedCacheAfter = JSON.parse(notAffectedUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(notAffectedCacheAfter).toEqual(notAffectedCacheBefore)
})


test('deleted users are removed from other caches', async () => {
  // when a user is deleted, the name and id are removed
  const myUser = await auth.createUser({
    uid: USER_ID,
    displayName: 'My Old Name',
  })
  await insertUser(db, myUser, true)
  const otherUser = await insertUserWithGames(db, 'other_user', 5)
  const oldCache = JSON.parse(otherUser.IMMUTABLE.last5Games) as GameSummary[]
  expect(oldCache.length).toEqual(5)
  
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
  expect(myUserAfter.exists).toEqual(false)
  
  const otherUserAfter = await db.collection('users').doc('other_user').get()
  const newCache = JSON.parse(otherUserAfter.data()!.IMMUTABLE.last5Games) as GameSummary[]
  expect(newCache.length).toEqual(5)
  expect(newCache[0].opponentId).toEqual(null)
  expect(newCache[0].opponentName).toEqual('[deleted]')
  expect(newCache[1].opponentId).toEqual(oldCache[1].opponentId)
  expect(newCache[1].opponentName).toEqual(oldCache[1].opponentName)
  expect(newCache[2].opponentId).toEqual(null)
  expect(newCache[2].opponentName).toEqual('[deleted]')
  expect(newCache[3].opponentId).toEqual(oldCache[3].opponentId)
  expect(newCache[3].opponentName).toEqual(oldCache[3].opponentName)
  expect(newCache[4].opponentId).toEqual(oldCache[4].opponentId)
  expect(newCache[4].opponentName).toEqual(oldCache[4].opponentName)
})


test('deleted users are removed from other caches, less than 5 games', async () => {
  // TODO
})

test('deleted users are removed from other caches, more than 5 games', async () => {
  // TODO
})
