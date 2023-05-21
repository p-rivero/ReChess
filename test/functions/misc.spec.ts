import { admin, fnTest, functions } from './init'
import type { ObjectMetadata } from 'firebase-functions/v1/storage'

test('this is test', async () => {
  const db = admin.firestore()
  const checkPieceHash = fnTest.wrap(functions.checkPieceHash)
  
  const image: ObjectMetadata = {
    name: 'test',
    bucket: 'rechess-web-piece-images',
    kind: 'storage#object',
    id: 'test',
    contentType: 'image/png',
    size: '123',
    updated: 'test',
    storageClass: 'test',
    timeCreated: 'test',
  }
  checkPieceHash(image)
  // Upload test image
  admin.storage().bucket('rechess-web-piece-images').upload('test.png', {
    destination: 'test',
    metadata: {
      contentType: 'image/png',
      metadata: {
        userId: 'test',
      },
    },
  })
})
