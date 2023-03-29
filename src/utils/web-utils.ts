
export function paramToInt(param: string|string[]): number {
  // If the param is an array, return the first element
  if (Array.isArray(param)) return paramToInt(param[0])
  const num = Number(param)
  return num
}

// Assume the font size will not change
let fontSz: number | undefined = undefined
export function remToPx(rem: number): number {
  if (fontSz === undefined) fontSz = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return rem * fontSz
}

export function updateTitle(title?: string) {
  if (!title) document.title = 'ReChess'
  else document.title = `${title} - ReChess`
}


/**
 * Crop an SVG to its bounding box. It also forces the SVG to be square.
 * @param {string} svg - The SVG to crop
 * @returns {string} The cropped SVG
 */
export function autoCropSvg(svg: string, padding = 1): string {
  // Get the svg element
  const div = document.createElement('div')
  div.innerHTML = svg
  const svgEl = div.querySelector('svg') as SVGSVGElement
  document.body.appendChild(svgEl)
  
  // Remove all elements without fill or stroke
  for (const el of svgEl.querySelectorAll('[fill="none"], [stroke="none"]')) {
    el.remove()
  }
  
  // Get the bounding box of the svg, add some padding and make it a square
  const bbox = svgEl.getBBox()
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  const maxDim = Math.max(bbox.width, bbox.height) + padding * 2
  const cropBox = {
    x: centerX - maxDim / 2,
    y: centerY - maxDim / 2,
    width: maxDim,
    height: maxDim,
  }
  
  // Update the svg's viewBox
  svgEl.setAttribute('viewBox', `${cropBox.x} ${cropBox.y} ${cropBox.width} ${cropBox.height}`)
  svgEl.setAttribute('width', `${cropBox.width}`)
  svgEl.setAttribute('height', `${cropBox.height}`)
  
  // Clean up
  document.body.removeChild(svgEl)
  // Remove empty lines that resulted from removing elements without fill or stroke
  return svgEl.outerHTML.replace(/^\s*\n/gm, '')
}


/**
 * Crop a transparent image to its bounding box. It also forces the image to be square.
 * @param {Blob} image - The image to crop
 * @param {number} alphaThreshold - The alpha value below which a pixel is considered transparent and should be cropped
 * @returns {Promise<Blob>} A promise that resolves to a WebP blob of the cropped image.
 * WebP is used because it supports transparency and is much smaller than PNG.
 */
export async function autoCropImage(image: Blob, alphaThreshold = 10, cropWhite = false): Promise<Blob> {
  // Create a canvas and get its context
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    console.warn('Could not get canvas context')
    return Promise.resolve(image)
  }
  
  // Draw the image on the canvas
  const img = new Image()
  img.src = URL.createObjectURL(image)
  // Wait for the image to load
  await new Promise<void>(resolve => {
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve()
    }
  })
  canvas.width = img.width
  canvas.height = img.height
  console.log(img.width, img.height)
  ctx.drawImage(img, 0, 0)
  
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const bound = {
    top: Infinity,
    left: Infinity,
    right: -Infinity,
    bottom: -Infinity,
  }
  
  const whiteThreshold = (256 - alphaThreshold) * 3
  
  // Iterate over every pixel and update the bounding box
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      // Get the pixel index (width * y + x) and multiply by 4 because each pixel has 4 values (RGBA)
      const i = (y * canvas.width + x) << 2
      const alpha = pixels.data[i + 3] // 4th value is alpha
      // Ignore almost transparent pixels
      if (alpha < alphaThreshold) continue
      // Ignore white pixels
      if (cropWhite && pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2] > whiteThreshold) continue

      if (x < bound.left) {
        bound.left = x
      }
      if (x > bound.right) {
        bound.right = x
      }
      if (y < bound.top) {
        bound.top = y
      }
      if (y > bound.bottom) {
        bound.bottom = y
      }
    }
  }

  // Calculate the height and width of the content
  let trimHeight = bound.bottom - bound.top
  let trimWidth = bound.right - bound.left
  // Force the image to be square
  if (trimHeight > trimWidth) {
    bound.left -= (trimHeight - trimWidth) / 2
    trimWidth = trimHeight
  } else if (trimWidth > trimHeight) {
    bound.top -= (trimWidth - trimHeight) / 2
    trimHeight = trimWidth
  }
  const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight)
  
  // Update the canvas size and draw the trimmed image
  canvas.width = trimWidth
  canvas.height = trimHeight
  ctx.putImageData(trimmed, 0, 0)
  
  // Return the trimmed image as WebP blob
  return new Promise(resolve => {
    canvas.toBlob(b => {
      if (!b) {
        console.warn('Could not convert canvas to blob')
        resolve(image)
        return
      }
      resolve(b)
    }, 'image/webp')
  })
}
