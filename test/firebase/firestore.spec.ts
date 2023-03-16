
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'

// Use the same ID as in the emulator if you want to see the requests in the
// emulator UI at: http://127.0.0.1:4000/firestore/requests
const PROJECT_ID = 'rechess-web'

let testEnv: RulesTestEnvironment
let { get, query, set, add, remove }: TestUtilsSignature = notInitialized()

// CONFIGURE TEST ENVIRONMENT

//! IMPORTANT: make sure the emulator is running (run "npm run dev" in another terminal)

beforeAll(async () => {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: 'localhost',
        port: 8080,
      }
    })
  } catch (e) {
    // Cannot connect to emulator
    process.exit(1)
  }
  // Supress console warnings
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // Set up test utils
  ({ get, query, set, add, remove } = setupTestUtils(testEnv))
})

afterAll(async () => {
  await testEnv.cleanup()
})

// Clear data between tests
afterEach(async () => {
  await testEnv.clearFirestore()
})



// TESTS

test('cannot access collections that do not exist', async () => {
  await assertFails(
    query('someone', 'nonexistent')
  )
  await assertFails(
    get('someone', 'nonexistent', '1234')
  )
  await assertFails(
    set('someone', { foo: 'bar' }, 'nonexistent', '1234')
  )
})

test('anyone can read created variants', async () => {
  await assertSucceeds(
    get('everyone', 'variants', '1234')
  )
})
