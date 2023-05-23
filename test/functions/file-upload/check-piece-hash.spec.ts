import { functions, initialize } from '../init'
import type { ObjectMetadata } from 'firebase-functions/lib/v1/providers/storage'

const { app, testEnv } = initialize('check-piece-hash-test')
const bucket = app.storage().bucket('rechess-web-piece-images')
const db = app.firestore()
const checkPieceHash = testEnv.wrap(functions.checkPieceHash)

function makeMetadata(filename: string): ObjectMetadata {
  return {
    name: filename,
    bucket: 'rechess-web-piece-images',
    kind: 'storage#object',
    id: 'test',
    contentType: 'image/png',
    size: '123',
    updated: 'test',
    storageClass: 'test',
    timeCreated: 'test',
  }
}


test('accepts images with correct hash', async () => {
  const IMAGE_SHA256 = '10afa016896de2ed687187497b6c8e4f1e0b285baaf5899cae35f157aaf4e5d3'
  const FILE_PATH = 'piece-images/' + IMAGE_SHA256
  
  await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: '1234' },
    },
  })
  
  await checkPieceHash(makeMetadata(FILE_PATH))
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
})

test('rejects images with an incorrect name', async () => {
  const FILE_PATH = 'piece-images/some-name'
  
  await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: '1234' },
    },
  })
  
  // spy on console.warn
  const spy = jest.spyOn(console, 'warn').mockImplementation((...args) => { 
    const msg = args.join(' ')
    // TODO: Uploader: 1234
    if (msg !== 'Deleting piece-images/some-name because the hash does not match the filename. Uploader: ') {
      throw new Error('Unexpected console.warn call: ' + msg)
    }
  })
  await checkPieceHash(makeMetadata(FILE_PATH))
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([false])
  
  if (spy.mock.calls.length !== 1) {
    throw new Error('Expected console.warn to be called')
  }
  spy.mockRestore()
})

test('ignores images in other directories', async () => {
  const FILE_PATH = 'another-directory/some-name'
  
  await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: '1234' },
    },
  })
  
  await checkPieceHash(makeMetadata(FILE_PATH))
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
})
