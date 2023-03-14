import { storage } from "@/firebase"
import { useAuthStore } from "@/stores/auth-user"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import type { UploadMetadata, UploadResult } from "firebase/storage"

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

export async function downloadBlob(filePath: string): Promise<Blob> {
  const url = await getUrl(filePath)
  const response = await fetch(url)
  return await response.blob()
}


export async function getUrl(filePath: string): Promise<string> {
  const fileRef = ref(storage, filePath)
  return await getDownloadURL(fileRef)
}

export async function getFilePath(url: string): Promise<string> {
  const fileRef = ref(storage, url)
  return fileRef.fullPath
}
