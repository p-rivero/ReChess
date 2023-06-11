
import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { assertFails, assertSucceeds, decodeData, uploadFile } from './utils'
import { getBytes } from 'firebase/storage'
import { setupJest, setupTestUtils } from './init'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let testEnv: RulesTestEnvironment | null = null
setupJest('test-storage-profile-images', 'default', env => testEnv = env)


test('can see profile picture of other users', async () => {
  const { unverified, notLogged, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data')
  await setupData('profile-images/other_user', 'other user image data')
  
  const myProfileImage = unverified.ref(`profile-images/${MY_ID}`)
  const someProfileImage = notLogged.ref('profile-images/other_user')
  const myData = await assertSucceeds(getBytes(myProfileImage))
  const someData = await assertSucceeds(getBytes(someProfileImage))
  expect(decodeData(myData)).toBe('some image data')
  expect(decodeData(someData)).toBe('other user image data')
})

test('cannot read or write to unknown paths', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const unknownPath = verified.ref('some/unknown/path')
  await assertFails(getBytes(unknownPath))
})


test('can create profile picture if verified', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertSucceeds(uploadFile(myProfileImage, 'test/img.png', MY_ID))
})

test('can update and delete profile picture if verified', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data')
  
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertSucceeds(uploadFile(myProfileImage, 'test/img.png', MY_ID))
  await assertSucceeds(myProfileImage.delete())
})


test('cannot create profile picture if not verified', async () => {
  const { unverified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const myProfileImage = unverified.ref(`profile-images/${MY_ID}`)
  await assertFails(uploadFile(myProfileImage, 'test/img.png', MY_ID))
})

test('cannot upload or delete profile picture if not verified', async () => {
  const { unverified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data')
  
  const myProfileImage = unverified.ref(`profile-images/${MY_ID}`)
  await assertFails(uploadFile(myProfileImage, 'test/img.png', MY_ID))
  await assertFails(myProfileImage.delete())
})

test('cannot update or delete profile picture of other users', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData('profile-images/other_user', 'other user image data')
  
  const otherProfileImage = verified.ref('profile-images/other_user')
  await assertFails(uploadFile(otherProfileImage, 'test/img.png', MY_ID))
  await assertFails(otherProfileImage.delete())
})


test('uploaded file must be an image', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertFails(uploadFile(myProfileImage, 'test/img.png', MY_ID, 'text/plain'))
  await assertSucceeds(uploadFile(myProfileImage, 'test/img.png', MY_ID, 'image/jpeg'))
})

test('uploaded file must be an image', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertFails(uploadFile(myProfileImage, 'test/img.png', MY_ID, 'text/plain'))
  await assertSucceeds(uploadFile(myProfileImage, 'test/img.png', MY_ID, 'image/jpeg'))
})

test('max image size is 200 KiB', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertFails(uploadFile(myProfileImage, 'test/201_KiB.txt', MY_ID, 'image/png'))
  await assertSucceeds(uploadFile(myProfileImage, 'test/199_KiB.txt', MY_ID, 'image/png'))
})

test('uploaded file metadata must contain uploader ID', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertFails(uploadFile(myProfileImage, 'test/img.png', 'some_other_id'))
  await assertSucceeds(uploadFile(myProfileImage, 'test/img.png', MY_ID))
})


test('can update metadata if verified', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data', { contentType: 'image/png', customMetadata: { userId: MY_ID } })
  
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertSucceeds(myProfileImage.updateMetadata({ customMetadata: { foo: 'bar' } }))
})

test('cannot remove userId or contentType', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data', { contentType: 'image/png', customMetadata: { userId: MY_ID } })
  
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertFails(myProfileImage.updateMetadata({ customMetadata: null }))
  await assertFails(myProfileImage.updateMetadata({ contentType: null }))
  await assertFails(myProfileImage.updateMetadata({ contentType: 'text/plain' }))
  await assertSucceeds(myProfileImage.updateMetadata({ contentType: 'image/jpeg' }))
})

test('cannot update metadata if not verified', async () => {
  const { unverified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data', { contentType: 'image/png', customMetadata: { userId: MY_ID } })
  
  const myProfileImage = unverified.ref(`profile-images/${MY_ID}`)
  await assertFails(myProfileImage.updateMetadata({ customMetadata: { foo: 'bar' } }))
})

test('cannot update metadata of other users', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData('profile-images/other_user', 'other user image data', { contentType: 'image/png', customMetadata: { userId: 'other_user' } })
  
  const otherProfileImage = verified.ref('profile-images/other_user')
  await assertFails(otherProfileImage.updateMetadata({ customMetadata: { foo: 'bar' } }))
})
