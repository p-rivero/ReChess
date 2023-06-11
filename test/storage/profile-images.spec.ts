
import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { assertFails, assertSucceeds, decodeData, uploadFile } from './utils'
import { getBytes } from 'firebase/storage'
import { setupJest, setupTestUtils } from './init'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let testEnv: RulesTestEnvironment | null = null
setupJest('test-storage-profile-images', 'default', env => testEnv = env)


test('can see profile picture of other users', async () => {
  const { unverified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data')
  await setupData('profile-images/other_user', 'other user image data')
  
  const myProfileImage = unverified.ref(`profile-images/${MY_ID}`)
  const otherProfileImage = unverified.ref('profile-images/other_user')
  const myData = await assertSucceeds(getBytes(myProfileImage))
  const otherData = await assertSucceeds(getBytes(otherProfileImage))
  expect(decodeData(myData)).toBe('some image data')
  expect(decodeData(otherData)).toBe('other user image data')
})

test('cannot read or write to unknown paths', async () => {
  const { verified } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  const unknownPath = verified.ref('some/unknown/path')
  await assertFails(getBytes(unknownPath))
})

test('can update and delete profile picture if verified', async () => {
  const { verified, setupData } = setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  await setupData(`profile-images/${MY_ID}`, 'some image data')
  
  const myProfileImage = verified.ref(`profile-images/${MY_ID}`)
  await assertSucceeds(uploadFile(myProfileImage, 'test/img.png', MY_ID))
  await assertSucceeds(myProfileImage.delete())
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

// uploaded file must be an image

// max image size is 200kiB
