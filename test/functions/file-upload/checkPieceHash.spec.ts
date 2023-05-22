import { admin, fnTest, functions } from '../init'
import type { ObjectMetadata } from 'firebase-functions/lib/v1/providers/storage'

const bucket = admin.storage().bucket('rechess-web-piece-images')

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
  const checkPieceHash = fnTest.wrap(functions.checkPieceHash)
  
  await bucket.upload('test/img.png', {
    destination: FILE_PATH,
  })
  
  await checkPieceHash(makeMetadata(FILE_PATH))
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
  await bucket.file(FILE_PATH).delete()
})

test('rejects images with an incorrect name', async () => {
  const FILE_PATH = 'piece-images/some-name'
  const checkPieceHash = fnTest.wrap(functions.checkPieceHash)
  
  await bucket.upload('test/img.png', {
    destination: FILE_PATH,
  })
  
  await checkPieceHash(makeMetadata(FILE_PATH))
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([false])
})

test('ignores images in other directories', async () => {
  const FILE_PATH = 'another-directory/some-name'
  const checkPieceHash = fnTest.wrap(functions.checkPieceHash)
  
  await bucket.upload('test/img.png', {
    destination: FILE_PATH,
  })
  
  await checkPieceHash(makeMetadata(FILE_PATH))
  
  const exists = await bucket.file(FILE_PATH).exists()
  expect(exists).toEqual([true])
  await bucket.file(FILE_PATH).delete()
})
