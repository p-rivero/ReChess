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
export function importFile(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => {
      const file = input.files?.item(0)
      if (file) {
        resolve(file)
      } else {
        reject('No file selected')
      }
    }
    input.click()
  })
}
