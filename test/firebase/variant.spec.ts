
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, add, remove, startBatch }: TestUtilsSignature = notInitialized()

setupJest('variant-tests', env => {
  ({ get, query, set, add, remove, startBatch } = setupTestUtils(env, MY_ID, MY_EMAIL))
})



test('anyone can read created variants', async () => {
  await assertSucceeds(
    get('not logged', 'variants', '1234')
  )
  await assertSucceeds(
    query('not logged', 'variants')
  )
})
