import { storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth-user'
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage'
import type { UploadMetadata, UploadResult } from 'firebase/storage'
import { FirebaseError } from '@firebase/util'


/**
 * Uploads a blob to cloud storage, at a given path. The user must be logged in,
 * and the user id will be added to the file metadata.
 * @param {Blob} file The file to upload
 * @param {string} filePath The path to upload the file to
 * @throws {Error} If the user is not logged in or if the upload fails
 */
export async function uploadBlob(file: Blob, filePath: string): Promise<UploadResult> {
  const authStore = useAuthStore()
  const user = authStore.loggedUser
  if (!user) throw new Error('User must be logged in to upload a file')
  const metadata: UploadMetadata = {
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
export async function downloadBlob(filePath: string): Promise<Blob | undefined> {
  const url = await getUrl(filePath)
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
export async function deleteFile(filePath: string): Promise<void> {
  const fileRef = ref(storage, filePath)
  await deleteObject(fileRef)
}


/**
 * Gets the download URL of a file in cloud storage. Can be used to check if a file exists.
 * @param {string} filePath The path to the file
 * @return {Promise<string | undefined>} A promise that resolves to the download URL,
 * or undefined if the file does not exist
 */
export async function getUrl(filePath: string): Promise<string | undefined> {
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
export async function getFilePath(url: string): Promise<string> {
  const fileRef = ref(storage, url)
  return fileRef.fullPath
}
