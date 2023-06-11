import { type StorageReference, type UploadMetadata, uploadBytes } from 'firebase/storage'
import fs from 'fs'

export function decodeData(buffer: ArrayBuffer) {
  return new TextDecoder().decode(buffer)
}

export async function uploadFile(ref: StorageReference, filePath: string, uploaderId: string) {
  const buffer = fs.readFileSync(filePath)
  // Get MIME type from file extension. There are more robust ways to do this, but this is good enough for testing.
  const extension = filePath.split('.').pop()
  const contentType = `image/${extension}`
  const metadata: UploadMetadata = {
    contentType,
    customMetadata: {
      userId: uploaderId,
    },
  }
  
  await uploadBytes(ref, buffer, metadata)
}

export { assertSucceeds, assertFails } from '../firestore/utils'
