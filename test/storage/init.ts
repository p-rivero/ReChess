import { type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { assertEmulatorsRunning } from '../test-common'
import { uploadString } from 'firebase/storage'
import type firebase from 'firebase/compat/app'

export function setupJest(projectId: string, onInit: (testEnv: RulesTestEnvironment) => void) {
  let testEnv: RulesTestEnvironment | null = null
  
  beforeAll(async () => {
    // Make sure the emulator is running (Use: firebase emulators:start --only firestore,storage,auth)
    await assertEmulatorsRunning()
    
    try {
      testEnv = await initializeTestEnvironment({
        projectId: projectId,
        storage: {
          host: 'localhost',
          port: 9199,
        },
      })
    } catch (e) {
      // Cannot connect to emulator
      process.exit(1)
    }
    onInit(testEnv)
  })
  
  afterAll(async () => {
    await testEnv?.cleanup()
  })
  
  // Clear data between tests
  afterEach(async () => {
    await testEnv?.clearStorage()
  })
}


type StorageInterface = {
  verified: firebase.storage.Storage,
  unverified: firebase.storage.Storage,
  notLogged: firebase.storage.Storage,
  moderator: firebase.storage.Storage,
  setupData(path: string, data: string): Promise<void>,
}
export function setupTestUtils(testEnv: RulesTestEnvironment|null, myId: string, myEmail: string): StorageInterface {
  if (!testEnv) throw new Error('testEnv is not initialized')
  
  const notLogged = testEnv.unauthenticatedContext().storage()
  const unverified = testEnv.authenticatedContext(myId, { email: myEmail, email_verified: false }).storage()
  const verified = testEnv.authenticatedContext(myId, { email: myEmail, email_verified: true }).storage()
  const moderator = testEnv.authenticatedContext(myId, { email: myEmail, email_verified: true, moderator: true }).storage()
  
  async function setupData(path: string, data: string) {
    if (!testEnv) throw new Error('testEnv is not initialized')
    await testEnv.withSecurityRulesDisabled(async context => {
      const storage = context.storage()
      const testRef = storage.ref(path)
      await uploadString(testRef, data)
    })
  }
  return { verified, unverified, notLogged, moderator, setupData }
}
