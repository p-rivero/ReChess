import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'


//! IMPORTANT: make sure the emulator is running (run "npm run dev" in another terminal)

// Use the same projectId as the emulator (in this case, 'rechess-web') if you want
// to see the requests in the emulator UI (http://127.0.0.1:4000/firestore/requests)

export function setupJest(projectId: string, onInit: (testEnv: RulesTestEnvironment) => void) {
  let testEnv: RulesTestEnvironment
  
  beforeAll(async () => {
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
    jest.spyOn(console, 'warn').mockImplementation(() => {})
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
