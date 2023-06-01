import { functions, initialize } from '../init'
import { expectLog } from '../utils'

const { app, testEnv } = initialize('check-piece-hash-test')
const bucket = app.storage().bucket()
const checkPieceHash = testEnv.wrap(functions.checkPieceHash)

const IMAGE_PATH = 'test/img.png'
const IMAGE_SHA256 = 'f3f585cc02937068c83d6912c27c84047763c6a39997850bf272b830bda79b37'
const UPLOADER_ID = 'some_user_id'

test('accepts images with correct hash', async () => {
  const FILE_PATH = 'piece-images/' + IMAGE_SHA256
  
  let [_file, metadata] = await bucket.upload(IMAGE_PATH, {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: UPLOADER_ID },
    },
  })
  
  await checkPieceHash(metadata)
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
})

test('rejects images with an incorrect name', async () => {
  const FILE_PATH = 'piece-images/some-name'
  
  let [_file, metadata] = await bucket.upload(IMAGE_PATH, {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: UPLOADER_ID },
    },
  })
  
  const done = expectLog('warn', 'Deleting piece-images/some-name because the hash does not match the filename. ' +
      `Uploader: ${UPLOADER_ID}`)
  await checkPieceHash(metadata)
  done()
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([false])
})

test('rejects images without uploader ID', async () => {
  const FILE_PATH = 'piece-images/' + IMAGE_SHA256
  
  let [_file, metadata] = await bucket.upload(IMAGE_PATH, {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      // Missing metadata
    },
  })
  
  const done = expectLog('warn', `Deleting piece-images/${IMAGE_SHA256} ` +
      'because it does not have an uploader ID')
  await checkPieceHash(metadata)
  done()
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([false])
})

test('ignores images in other directories', async () => {
  const FILE_PATH = 'another-directory/some-name'
  
  let [_file, metadata] = await bucket.upload(IMAGE_PATH, {
    destination: FILE_PATH,
    metadata: {
      contentType: `image/png`,
      metadata: { userId: UPLOADER_ID },
    },
  })
  
  await checkPieceHash(metadata)
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
})
