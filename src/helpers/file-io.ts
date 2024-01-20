// Initiate a file download from a Blob object
export function exportFile(file: Blob, fileName: string) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(file)
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  })
}

// Prompt the user to select a file and return the file as a Blob object
export function importFile(contentType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = contentType
    input.onchange = () => {
      const file = input.files?.item(0)
      if (file) {
        resolve(file)
      } else {
        reject(new Error('No file selected'))
      }
    }
    input.click()
  })
}

// Compute the SHA-256 hash of a Blob object
export async function hashBlob(blob: Blob): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}
