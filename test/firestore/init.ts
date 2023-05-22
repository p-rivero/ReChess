import { type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { assertEmulatorsRunning } from '../test-common'

// Use the same projectId as the emulator (in this case, 'rechess-web') if you want
// to see the requests in the emulator UI (http://127.0.0.1:4000/firestore/requests)

export function setupJest(projectId: string, onInit: (testEnv: RulesTestEnvironment) => void) {
  let testEnv: RulesTestEnvironment
  
  beforeAll(async () => {
    // Make sure the emulator is running (Use: firebase emulators:start --only firestore,storage,auth)
    // assertEmulatorRunning('Firestore', 8080, true)
    await assertEmulatorsRunning()
    
    testEnv = await initializeTestEnvironment({
      projectId: projectId,
      firestore: {
        host: 'localhost',
        port: 8080,
      },
    })
    // Supress console warnings
    jest.spyOn(console, 'warn').mockImplementation(() => { /* suppress warnings */ })
    onInit(testEnv)
  })
  
  afterAll(async () => {
    await testEnv.cleanup()
  })
  
  // Clear data between tests
  afterEach(async () => {
    await testEnv.clearFirestore()
  })
}
