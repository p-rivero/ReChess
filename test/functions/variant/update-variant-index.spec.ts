import { VariantDoc, VariantIndexDoc } from '@/firebase/db/schema'
import { functions, initialize } from '../init'
import { expectLog, expectNoErrorLog } from '../utils'
import { insertVariant, insertIndex } from './variant-mock'

const { app, testEnv } = initialize('update-variant-index-test')
const db = app.firestore()
const updateVariantIndex = testEnv.wrap(functions.updateVariantIndex)

// https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields
const MAX_INDEX_SIZE = 1_048_487
const VARIANT_ID = 'new_variant_id'

function getExpectedLine(variant: VariantDoc, overrideTags?: string[]) {
  const name = variant.name.toLowerCase()
  const description = variant.description.toLowerCase()
  const tags = overrideTags ?
    overrideTags.join(',') :
    variant.tags.join(',').toLowerCase()
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



test('maximum tag length is 35 chars, success', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID)
  variantDoc.tags = ['some_tag', 'a'.repeat(35), 'another_tag']
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const variantAfter = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variantAfter.exists).toBe(true)
})

test('maximum tag length is 35 chars, failure', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID, 'white', 'some_creator_id')
  variantDoc.tags = ['some_tag', 'a'.repeat(36), 'another_tag']
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectLog('warn', `Deleting variant with invalid tags. creatorId: some_creator_id`)
  await updateVariantIndex(snap)
  done()
  
  const variantAfter = await db.collection('variants').doc(VARIANT_ID).get()
  expect(variantAfter.exists).toBe(false)
})

test('tags are converted to lowercase and illegal chars are deleted', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID, 'white', 'some_creator_id')
  variantDoc.tags = ['some#_##ta,,g', 'aNOTHEr\n\t_tag', 'THIRD TAG']
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexDoc = await db.collection('variantIndex').doc('0').get()
  expect(indexDoc.data()).toEqual({
    index: getExpectedLine(variantDoc, ['some_tag', 'another_tag', 'thirdtag']),
  })
})

test('tabs and newlines are deleted from name and description', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID, 'white', 'some_creator_id')
  variantDoc.name = 'some\nname\t\twith\ttabs'
  variantDoc.description = 'some\n\tdescription'
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexDoc = await db.collection('variantIndex').doc('0').get()
  expect(indexDoc.data()).toEqual({
    index: `${VARIANT_ID}\tsome name  with tabs\tsome  description\t`,
  })
})

test('name and description are cropped and converted to lowercase', async () => {
  const variantDoc = await insertVariant(db, VARIANT_ID, 'white', 'some_creator_id')
  variantDoc.name = 'Some NAME'
  variantDoc.description = 'AbCd'.repeat(100) // 400 chars
  const snap = testEnv.firestore.makeDocumentSnapshot(variantDoc, `variants/${VARIANT_ID}`)
  
  const done = expectNoErrorLog()
  await updateVariantIndex(snap)
  done()
  
  const indexDoc = await db.collection('variantIndex').doc('0').get()
  expect(indexDoc.data()).toEqual({
    index: `${VARIANT_ID}\tsome name\t${'abcd'.repeat(25)}\t`,
  })
})
