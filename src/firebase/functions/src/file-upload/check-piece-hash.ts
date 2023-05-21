
import { createHash } from 'node:crypto'
import { useAdmin } from '../helpers'
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
  
  // Download the image
  const admin = await useAdmin()
  const fileRef = admin.storage().bucket(image.bucket).file(image.name)
  const [file] = await fileRef.download()
  
  // Compute the hash of the image
  const hash = createHash('sha256').update(file).digest('hex')
  
  // Check if the filename matches the hash
  const fileName = image.name.split('/').pop()
  if (fileName !== hash) {
    console.warn('Deleting', image.name, 'because the hash does not match the filename.')
    console.info('Uploader:', image.metadata?.userId)
    await fileRef.delete()
  }
}
