import { functions, initialize } from '../init'
import { makeFirestoreContext } from '../make-context'
import { insertVariant } from '../variant/variant-mock'
import admin from 'firebase-admin'
import type { LobbySlotDoc, VariantDoc } from '@/firebase/db/schema'
import type { Timestamp } from 'firebase/firestore'
import { expectNoErrorLog } from '../utils'

const { app, testEnv } = initialize('update-lobby-slot-test')
const db = app.firestore()
const onCreateLobbySlot = testEnv.wrap(functions.onCreateLobbySlot)
const onRemoveLobbySlot = testEnv.wrap(functions.onRemoveLobbySlot)

const VARIANT_ID = 'some_variant_id'
const CREATOR_ID = 'some_user_id'

function makeSnap() {
  const doc: LobbySlotDoc = { 
    IMMUTABLE: {
      creatorDisplayName: '@some_user',
      creatorImageUrl: null,
      timeCreated: admin.firestore.Timestamp.now() as Timestamp,
      requestedColor: 'black',
      gameDocId: null,
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
  }
  return testEnv.firestore.makeDocumentSnapshot(doc, `variants/${VARIANT_ID}/lobby/${CREATOR_ID}`)
}
function makeContext() {
  return makeFirestoreContext({ variantId: VARIANT_ID, creatorUserId: CREATOR_ID })
}



test('when a slot is created, variant popularity is incremented', async () => {
  const variantBefore = await insertVariant(db, VARIANT_ID)
  const snap = makeSnap()
  const context = makeContext()
  
  const done = expectNoErrorLog()
  await onCreateLobbySlot(snap, context)
  done()
  
  const variantAfter = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  expect(variantAfter).toEqual({
    ...variantBefore,
    popularity: variantBefore.popularity + 3,
  })
})

test('when a slot is deleted, variant popularity is decremented', async () => {
  const variantBefore = await insertVariant(db, VARIANT_ID)
  const snap = makeSnap()
  const context = makeContext()
  
  const done = expectNoErrorLog()
  await onRemoveLobbySlot(snap, context)
  done()
  
  const variantAfter = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  expect(variantAfter).toEqual({
    ...variantBefore,
    popularity: variantBefore.popularity - 3,
  })
})

test('creating and deleting has no effect', async () => {
  const variantBefore = await insertVariant(db, VARIANT_ID)
  const snap = makeSnap()
  const context = makeContext()
  
  const done = expectNoErrorLog()
  await onCreateLobbySlot(snap, context)
  await onRemoveLobbySlot(snap, context)
  done()
  
  const variantAfter = (await db.collection('variants').doc(VARIANT_ID).get()).data() as VariantDoc
  expect(variantAfter).toEqual(variantBefore)
})


