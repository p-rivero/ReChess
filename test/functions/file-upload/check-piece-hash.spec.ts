import { functions, initialize } from '../init'
import { expectWarn } from '../utils'

const { app, testEnv } = initialize('check-piece-hash-test')
const bucket = app.storage().bucket('rechess-web-piece-images')
const db = app.firestore()
const checkPieceHash = testEnv.wrap(functions.checkPieceHash)

test('accepts images with correct hash', async () => {
  const IMAGE_SHA256 = '10afa016896de2ed687187497b6c8e4f1e0b285baaf5899cae35f157aaf4e5d3'
  const FILE_PATH = 'piece-images/' + IMAGE_SHA256
  
  let [_file, metadata] = await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: '1234' },
    },
  })
  
  await checkPieceHash(metadata)
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
})

test('rejects images with an incorrect name', async () => {
  const FILE_PATH = 'piece-images/some-name'
  
  let [_file, metadata] = await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: '1234' },
    },
  })
  
  const spy = expectWarn('Deleting piece-images/some-name because the hash does not match the filename. Uploader: 1234')
  
  await checkPieceHash(metadata)
  
  spy.done()
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([false])
})

test('rejects images without uploader ID', async () => {
  const IMAGE_SHA256 = '10afa016896de2ed687187497b6c8e4f1e0b285baaf5899cae35f157aaf4e5d3'
  const FILE_PATH = 'piece-images/' + IMAGE_SHA256
  
  let [_file, metadata] = await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      // Missing metadata
    },
  })
  
  const spy = expectWarn('Deleting piece-images/10afa016896de2ed687187497b6c8e4f1e0b285baaf5899cae35f157aaf4e5d3 ' +
      'because it does not have an uploader ID')
  
  await checkPieceHash(metadata)
  
  spy.done()
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([false])
})

test('ignores images in other directories', async () => {
  const FILE_PATH = 'another-directory/some-name'
  
  let [_file, metadata] = await bucket.upload('test/img.png', {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: '1234' },
    },
  })
  
  await checkPieceHash(metadata)
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
})
