
import { createHash } from 'node:crypto'
import { useAdmin } from '../helpers'
import type { File } from '@google-cloud/storage'
import type { ObjectMetadata } from 'firebase-functions/v1/storage'

/**
 * Called when a user uploads a piece image. Checks if the filename matches the
 * hash of the image and, if not, deletes the file.
 * @param {ObjectMetadata} image The object metadata of the uploaded image
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(image: ObjectMetadata): Promise<void> {
  if (!image.name) return
  if (!image.name.startsWith('piece-images/')) return
  
  const { storage } = await useAdmin()
  const fileRef = storage.bucket(image.bucket).file(image.name)
  
  if (!(image.metadata?.userId)) {
    console.warn('Deleting', image.name, 'because it does not have an uploader ID')
    await fileRef.delete()
    return
  }
  
  // Check if the filename matches the hash
  const hash = await computeImageHash(fileRef)
  const fileName = image.name.split('/').pop()
  if (fileName !== hash) {
    const uploader = image.metadata.userId
    console.warn('Deleting', image.name, 'because the hash does not match the filename. Uploader:', uploader)
    await fileRef.delete()
  }
}

async function computeImageHash(fileRef: File) {
  const [file] = await fileRef.download()
  return createHash('sha256').update(file).digest('hex')
}
