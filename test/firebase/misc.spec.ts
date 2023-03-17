
import { assertFails } from '@firebase/rules-unit-testing'
import { notInitialized, setupTestUtils, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set }: TestUtilsSignature = notInitialized()

setupJest('misc-tests', env => {
  ({ get, query, set } = setupTestUtils(env, MY_ID, MY_EMAIL))
})



test('cannot access collections that do not exist', async () => {
  await assertFails(
    query('verified', 'nonexistent')
  )
  await assertFails(
    get('verified', 'nonexistent', '1234')
  )
  await assertFails(
    set('verified', { foo: 'bar' }, 'nonexistent', '1234')
  )
})
