import { VariantDoc, VariantIndexDoc } from '@/firebase/db/schema'
import { functions, initialize } from '../init'
import { expectNoErrorLog } from '../utils'
import { insertVariant, insertIndex } from './variant-mock'

const { app, testEnv } = initialize('update-variant-index-test')
const db = app.firestore()
const updateVariantIndex = testEnv.wrap(functions.updateVariantIndex)

// https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields
const MAX_INDEX_SIZE = 1_048_487
const VARIANT_ID = 'new_variant_id'

function getExpectedLine(variant: VariantDoc) {
  const name = variant.name.toLowerCase()
  const description = variant.description.toLowerCase()
  const tags = variant.tags.join(',').toLowerCase()
  return `${VARIANT_ID}\t${name}\t${description}\t${tags}`
}

function getRemainingSpace(line: string) {
  // -1 for the newline
  return MAX_INDEX_SIZE - line.length - 1 
}
function makePadding(length: number) {
  return '#'.repeat(length)
}


test('create first variant', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexDoc = await db.collection('variantIndex').doc('0').get()
  expect(indexDoc.data()).toEqual({
    index: getExpectedLine(variantDoc),
  })
})

test('add variant to existing index', async () => {
  await insertIndex(db, [
    {id: 'some_variant_id', name: 'some variant', description: 'the description', tags: ['some', 'tags']},
    {id: 'another_variant_id', name: 'another variant', description: 'the description', tags: ['some', 'other', 'tags']},
  ])
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexDoc = await db.collection('variantIndex').doc('0').get()
  expect(indexDoc.data()).toEqual({
    index: 'some_variant_id\tsome variant\tthe description\tsome,tags\n' + 
      'another_variant_id\tanother variant\tthe description\tsome,other,tags\n' + 
      `${getExpectedLine(variantDoc)}`,
  })
})

test('almost overflow to next index page', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  const expectedLine = getExpectedLine(variantDoc)
  const remainingBytes = getRemainingSpace(expectedLine)
  
  await db.collection('variantIndex').doc('0').set({
    index: makePadding(remainingBytes),
  })
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexPage0 = await db.collection('variantIndex').doc('0').get()
  const indexPage0Data = indexPage0.data() as VariantIndexDoc
  expect(indexPage0Data).toEqual({
    index: makePadding(remainingBytes) + '\n' + getExpectedLine(variantDoc),
  })
  expect(indexPage0Data.index.length).toBe(MAX_INDEX_SIZE)
  const indexPage1 = await db.collection('variantIndex').doc('1').get()
  expect(indexPage1.exists).toBe(false)
})

test('overflow to next index page', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  const expectedLine = getExpectedLine(variantDoc)
  const remainingBytes = getRemainingSpace(expectedLine)
  
  await db.collection('variantIndex').doc('0').set({
    index: makePadding(remainingBytes + 1),
  })
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexPage1 = await db.collection('variantIndex').doc('1').get()
  expect(indexPage1.data()).toEqual({
    index: getExpectedLine(variantDoc),
  })
})

test('overflow to next index page, many pages', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  const expectedLine = getExpectedLine(variantDoc)
  const remainingBytes = getRemainingSpace(expectedLine)
  
  await db.collection('variantIndex').doc('0').set({
    index: makePadding(remainingBytes + 1),
  })
  await db.collection('variantIndex').doc('1').set({
    index: makePadding(remainingBytes + 1),
  })
  await db.collection('variantIndex').doc('2').set({
    index: makePadding(remainingBytes + 1),
  })
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexPage3 = await db.collection('variantIndex').doc('3').get()
  expect(indexPage3.data()).toEqual({
    index: getExpectedLine(variantDoc),
  })
})

test('entry fills the first free page', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID)
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  const expectedLine = getExpectedLine(variantDoc)
  const remainingBytes = getRemainingSpace(expectedLine)
  
  await db.collection('variantIndex').doc('0').set({
    index: makePadding(remainingBytes + 1),
  })
  await db.collection('variantIndex').doc('1').set({
    index: makePadding(500),
  })
  await db.collection('variantIndex').doc('2').set({
    index: makePadding(remainingBytes + 1),
  })
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexPage1 = await db.collection('variantIndex').doc('1').get()
  expect(indexPage1.data()).toEqual({
    index: makePadding(500) + '\n' + getExpectedLine(variantDoc),
  })
  const indexPage3 = await db.collection('variantIndex').doc('3').get()
  expect(indexPage3.exists).toBe(false)
})
