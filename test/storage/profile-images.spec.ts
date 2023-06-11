
import { setupJest, setupTestUtils } from './init'
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let testEnv: RulesTestEnvironment | null = null
setupJest('test-storage-profile-images', 'default', env => testEnv = env)



test('can see profile picture of other users', async () => {
  setupTestUtils(testEnv, MY_ID, MY_EMAIL)
  
})

test.skip('can see profile picture of other users', async () => {
  // TODO: implement tests
})


// cannot read or write to other locations (piece-images)

// can upload and delete profile picture if verified

// cannot modify profile picture of other users

// cannot delete profile picture of other users

// cannot upload or delete profile picture if not verified

// uploaded file must be an image

// max image size is 200KiB
