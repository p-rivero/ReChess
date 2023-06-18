import { type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { type UploadMetadata, uploadString } from 'firebase/storage'
import { assertEmulatorsRunning } from '../test-common'
import fs from 'fs'
import type firebase from 'firebase/compat/app'

/** Choose which storage rules file to load */
export type StorageRules = 'default' | 'piece-images'

const RULES_PATH: Record<StorageRules, string> = {
  'default': 'src/firebase/storage/default.rules',
  'piece-images': 'src/firebase/storage/piece-images.rules',
}

export function setupJest(projectId: string, rules: StorageRules, onInit: (testEnv: RulesTestEnvironment) => void, dependOn?: string) {
  let testEnv: RulesTestEnvironment | null = null
  
  beforeAll(async () => {
    // Make sure the emulator is running (Use: firebase emulators:start --only firestore,storage,auth)
    await assertEmulatorsRunning()
    globalThis.process.env['RUNNING_TEST_' + projectId] = 'true'
    
    if (dependOn) {
      // Give some time for the other test to start, and then wait for it to finish
      await new Promise(resolve => setTimeout(resolve, 4000))
      while (globalThis.process.env['RUNNING_TEST_' + dependOn]) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    try {
      testEnv = await initializeTestEnvironment({
        projectId: projectId,
        storage: {
          host: 'localhost',
          port: 9199,
          rules: fs.readFileSync(RULES_PATH[rules], 'utf8'),
        },
      })
    } catch (e) {
      // Cannot connect to emulator
      console.error(e)
      process.exit(0)
    }
    onInit(testEnv)
  }, 100000)
  
  afterAll(async () => {
    globalThis.process.env['RUNNING_TEST_' + projectId] = undefined
    await testEnv?.cleanup()
  })
  
  // Clear data between tests
  afterEach(async () => {
    async function clearData(ref: firebase.storage.Reference): Promise<void> {
      const list = await ref.listAll()
      await Promise.all(list.items.map(i => i.delete())) // Delete files
      await Promise.all(list.prefixes.map(p => clearData(p))) // Call recursively on subdirectories
    }
    await testEnv?.withSecurityRulesDisabled(context => clearData(context.storage().ref()))
  })
}


interface StorageInterface {
  verified: firebase.storage.Storage,
  unverified: firebase.storage.Storage,
  notLogged: firebase.storage.Storage,
  moderator: firebase.storage.Storage,
  setupData(path: string, data: string, metadata?: UploadMetadata): Promise<void>,
}
export function setupTestUtils(testEnv: RulesTestEnvironment|null, myId: string, myEmail: string): StorageInterface {
  if (!testEnv) throw new Error('testEnv is not initialized')
  
  const notLogged = testEnv.unauthenticatedContext().storage()
  const unverified = testEnv.authenticatedContext(myId, { email: myEmail, email_verified: false }).storage()
  const verified = testEnv.authenticatedContext(myId, { email: myEmail, email_verified: true }).storage()
  const moderator = testEnv.authenticatedContext(myId, { email: myEmail, email_verified: true, moderator: true }).storage()
  
  async function setupData(path: string, data: string, metadata?: UploadMetadata) {
    if (!testEnv) throw new Error('testEnv is not initialized')
    await testEnv.withSecurityRulesDisabled(async context => {
      const storage = context.storage()
      const testRef = storage.ref(path)
      await uploadString(testRef, data, 'raw', metadata)
    })
  }
  
  return { verified, unverified, notLogged, moderator, setupData }
}
