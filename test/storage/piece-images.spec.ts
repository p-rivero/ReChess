
import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { assertFails, assertSucceeds, decodeData, uploadFile } from './utils'
import { getBytes } from 'firebase/storage'
import { setupJest, setupTestUtils } from './init'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let testEnv: RulesTestEnvironment | null = null
setupJest('test-storage-piece-images', 'piece-images', env => testEnv = env)


test('anyone can see all piece images', async () => {
  const { unverified, notLogged, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData('piece-images/some_hash', 'some image data')
  await setupData('piece-images/another_hash', 'another image data')
  
  const someImage = unverified.ref('piece-images/some_hash')
  const anotherImage = notLogged.ref('piece-images/another_hash')
  const myData = await assertSucceeds(getBytes(someImage))
  const otherData = await assertSucceeds(getBytes(anotherImage))
  expect(decodeData(myData)).toBe('some image data')
  expect(decodeData(otherData)).toBe('another image data')
})

test('cannot read or write to unknown paths', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const unknownPath = verified.ref('some/unknown/path')
  await assertFails(getBytes(unknownPath))
})


test('can upload piece image if verified', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertSucceeds(uploadFile(uploadRef, 'test/img.png', MY_ID))
})

test('cannot overwrite existing piece image', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData('piece-images/test_hash', 'an existing image')
  
  // Prevent a malicious user from overwriting the existing images of another user
  // Since the filename is a hash, legitimate users should never collide
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertFails(uploadFile(uploadRef, 'test/img.png', MY_ID))
})

test('cannot delete uploaded piece image', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertSucceeds(uploadFile(uploadRef, 'test/img.png', MY_ID))
  await assertFails(uploadRef.delete())
})

test('cannot upload piece image if not verified', async () => {
  const { unverified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = unverified.ref('piece-images/test_hash')
  await assertFails(uploadFile(uploadRef, 'test/img.png', MY_ID))
})


test('uploaded file must be an image', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertFails(uploadFile(uploadRef, 'test/img.png', MY_ID, 'text/plain'))
  await assertSucceeds(uploadFile(uploadRef, 'test/img.png', MY_ID, 'image/jpeg'))
})

test('max image size is 200 KiB', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertFails(uploadFile(uploadRef, 'test/201_KiB.txt', MY_ID, 'image/png'))
  await assertSucceeds(uploadFile(uploadRef, 'test/199_KiB.txt', MY_ID, 'image/png'))
})

test('uploaded file metadata must contain uploader ID', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertFails(uploadFile(uploadRef, 'test/img.png', 'some_other_id'))
  await assertSucceeds(uploadFile(uploadRef, 'test/img.png', MY_ID))
})


test('cannot update metadata', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const uploadRef = verified.ref('piece-images/test_hash')
  await assertSucceeds(uploadFile(uploadRef, 'test/img.png', MY_ID))
  await assertFails(uploadRef.updateMetadata({ contentType: 'image/jpeg' }))
})
