import { FirebaseError } from '@firebase/util'
import { type FirebaseStorage, type UploadMetadata, type UploadResult, deleteObject, getDownloadURL , ref, uploadBytes } from 'firebase/storage'
import { defaultStorage, pieceStorage } from '@/firebase'
import { useAuthStore } from '@/stores/auth-user'


export type CacheHeader = `${'public' | 'private'}, max-age=${number}${', immutable' | ''}`

const DEFAULT_CACHE: CacheHeader = 'public, max-age=31536000, immutable'

export type Bucket = 'default' | 'piece-images'

/**
 * Uploads a blob to cloud storage, at a given path. The user must be logged in,
 * and the user id will be added to the file metadata.
 * @param {Blob} file The file to upload
 * @param {string} filePath The path to upload the file to
 * @param {CacheHeader} cache The cache header to set on the file.
 * By default: `public, max-age=31536000, immutable` (publicly readable file, cached for 1 year).
 *
 * Unless you need the cache to be private, you should not change this. The download URI contains
 * an access token that depends on the file contents, so we can cache indefinitely and re-download
 * as soon as the file changes.
 * @throws {Error} If the user is not logged in or if the upload fails
 */
export async function uploadBlob(file: Blob, bucket: Bucket, filePath: string, cache = DEFAULT_CACHE): Promise<UploadResult> {
  const authStore = useAuthStore()
  const storage = getStorageRef(bucket)
  const user = authStore.loggedUser
  if (!user) throw new Error('User must be logged in to upload a file')
  const metadata: UploadMetadata = {
    cacheControl: cache,
    customMetadata: {
      userId: user.uid,
    },
  }
  const fileRef = ref(storage, filePath)
  const result = await uploadBytes(fileRef, file, metadata)
  return result
}

/**
 * Downloads a blob from cloud storage, from a given path. Can be used to check if a file exists.
 * @param {string} filePath The path to download the file from
 * @return {Promise<Blob | undefined>} A promise that resolves to the blob, or undefined if the file does not exist
 * @throws {Error} If the user does not have permission to download the file
 */
export async function downloadBlob(bucket: Bucket, filePath: string): Promise<Blob | undefined> {
  const url = await getUrl(bucket, filePath)
  if (!url) return undefined
  
  const response = await fetch(url)
  if (response.ok) {
    return response.blob()
  }
  throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
}

/**
 * Deletes a file in cloud storage.
 * @param {string} filePath The path to the file
 * @return {Promise<void>} A promise that resolves when the file is deleted
 * @throws {Error} If the user is not logged in or does not have permission to delete the file
 */
export async function deleteFile(bucket: Bucket, filePath: string): Promise<void> {
  const storage = getStorageRef(bucket)
  const fileRef = ref(storage, filePath)
  await deleteObject(fileRef)
}


/**
 * Gets the download URL of a file in cloud storage. Can be used to check if a file exists.
 * @param {string} filePath The path to the file
 * @return {Promise<string | undefined>} A promise that resolves to the download URL,
 * or undefined if the file does not exist
 */
export async function getUrl(bucket: Bucket, filePath: string): Promise<string | undefined> {
  const storage = getStorageRef(bucket)
  const fileRef = ref(storage, filePath)
  try {
    const url = await getDownloadURL(fileRef)
    return url
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'storage/object-not-found') {
      return undefined
    }
    throw error
  }
}

/**
 * Gets the file path of a file in cloud storage.
 * @param {string} url The download URL of the file
 * @return {Promise<string>} A promise that resolves to the file path
 */
export async function getFilePath(bucket: Bucket, url: string): Promise<string> {
  const storage = getStorageRef(bucket)
  const fileRef = ref(storage, url)
  return fileRef.fullPath
}


function getStorageRef(bucket: Bucket): FirebaseStorage {
  switch (bucket) {
  case 'default': return defaultStorage
  case 'piece-images': return pieceStorage
  default: throw new Error(`Invalid bucket: ${bucket}`)
  }
}
