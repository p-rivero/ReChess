import { type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { assertEmulatorsRunning } from '../test-common'

// Use the same projectId as the emulator (in this case, 'rechess-web') if you want
// to see the requests in the emulator UI (http://127.0.0.1:4000/firestore/requests)

export function setupJest(projectId: string, onInit: (testEnv: RulesTestEnvironment) => void) {
  let testEnv: RulesTestEnvironment | null = null
  
  beforeAll(async () => {
    // Make sure the emulator is running (Use: firebase emulators:start --only firestore,storage,auth)
    // assertEmulatorRunning('Firestore', 8080, true)
    await assertEmulatorsRunning()
    
    try {
      testEnv = await initializeTestEnvironment({
        projectId: projectId,
        firestore: {
          host: 'localhost',
          port: 8080,
        },
      })
    } catch (e) {
      // Cannot connect to emulator
      process.exit(1)
    }
    // Supress console warnings
    jest.spyOn(console, 'warn').mockImplementation((...e) => {
      const last = e[e.length - 1]
      if (typeof last === 'string' && last.startsWith('7 PERMISSION_DENIED:')) return
      console.warn(...e)
    })
    onInit(testEnv)
  })
  
  afterAll(async () => {
    await testEnv?.cleanup()
  })
  
  // Clear data between tests
  afterEach(async () => {
    await testEnv?.clearFirestore()
  })
}
