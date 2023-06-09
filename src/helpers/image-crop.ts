
/**
 * Crop an SVG to make it a square. The canvas is resized such that a given ratio of the image is covered
 * by the SVG shape (e.g. `0.33` means that 1/3 of the pixels will be opaque when the cropped SVG is rendered).
 * If the SVG is not compact enough, the real ratio will be lower to avoid cropping information.
 * @param {Blob} svg - A blob containing the SVG to crop
 * @param {number} ratioTarget - The target content-to-background ratio of the cropped SVG
 * @returns {Promise<Blob>} A promise that resolves to an SVG blob of the cropped image.
 */
export async function autoCropSvg(svg: Blob, ratioTarget = 0.35, maxHeight = 0.75): Promise<Blob> {
  const RASTER_SIZE = 1000
  let ctx: CanvasRenderingContext2D
  try {
    ctx  = await makeCanvas(svg, RASTER_SIZE)
  } catch (e) {
    console.warn('Could not draw image on canvas:', e)
    return Promise.resolve(svg)
  }
  
  // Get the square bounding box of the image
  const rasterBox = getSquareBBox(ctx, 20, false, ratioTarget, maxHeight)
    
  
  // Create an svg element
  const svgText = await svg.text()
  const div = document.createElement('div')
  div.innerHTML = svgText
  const svgEl = div.querySelector('svg') as SVGSVGElement
  
  const svgWidthAttr = svgEl.getAttribute('width')
  const svgHeightAttr = svgEl.getAttribute('height')
  const svgViewBoxAttr = svgEl.getAttribute('viewBox')
  const svgWidth = parseFloat(svgViewBoxAttr?.split(' ')[2] ?? svgWidthAttr ?? '300')
  const svgHeight = parseFloat(svgViewBoxAttr?.split(' ')[3] ?? svgHeightAttr ?? '300')
  const svgBox = {
    x: rasterBox.x / RASTER_SIZE * svgWidth,
    y: rasterBox.y / RASTER_SIZE * svgHeight,
    size: rasterBox.size / RASTER_SIZE * svgWidth,
  }
  
  // Update the svg's viewBox
  svgEl.setAttribute('viewBox', `${svgBox.x} ${svgBox.y} ${svgBox.size} ${svgBox.size}`)
  svgEl.setAttribute('width', `${svgBox.size}`)
  svgEl.setAttribute('height', `${svgBox.size}`)
  
  // Create a new blob
  return new Blob([svgEl.outerHTML], { type: 'image/svg+xml' })
}


/**
 * Crop a raster image to make it a square. The canvas is resized such that a given ratio of the image is covered
 * by non-background pixels (e.g. `0.33` means that the content of the image covers 1/3 of the pixels).
 * @param {Blob} image - A blob containing the image to crop
 * @param {number} resizeWidth - The width (and height) of the cropped image
 * @param {boolean} cropWhite - If `true`, white pixels will be considered as background. Otherwise, transparent pixels will be considered as background.
 * @param {number} ratioTarget - The target content-to-background ratio of the cropped image
 * @returns {Promise<Blob>} A promise that resolves to a WebP blob of the cropped image.
 * WebP is used because it supports transparency and is much smaller than PNG.
 */
export async function autoCropImage(image: Blob, resizeWidth: number, cropWhite = false, ratioTarget = 0.35, maxHeight = 0.75): Promise<Blob> {
  let ctx: CanvasRenderingContext2D
  try {
    ctx = await makeCanvas(image)
  } catch (e) {
    console.warn('Could not draw image on canvas:', e)
    return Promise.resolve(image)
  }
  
  // Get the square bounding box of the image
  const box = getSquareBBox(ctx, 20, cropWhite, ratioTarget, maxHeight)
  
  // Crop and resize the image
  const croppedCanvas = document.createElement('canvas')
  croppedCanvas.width = resizeWidth
  croppedCanvas.height = resizeWidth
  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) {
    console.warn('Could not get canvas context')
    return Promise.resolve(image)
  }
  croppedCtx.imageSmoothingQuality = 'high'
  croppedCtx.drawImage(ctx.canvas, box.x, box.y, box.size, box.size, 0, 0, resizeWidth, resizeWidth)
  
  // Return the trimmed image as WebP blob (quality 0.8)
  return new Promise(resolve => {
    croppedCanvas.toBlob(b => {
      if (!b) {
        console.warn('Could not convert canvas to blob')
        resolve(image)
        return
      }
      resolve(b)
    }, 'image/webp', 0.8)
  })
}


// Returns a canvas containing an image with the given width and height
async function makeCanvas(image: Blob, width?: number) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not get canvas context')
  
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
  if (width) {
    const aspectRatio = img.width / img.height
    canvas.width = width
    canvas.height = width / aspectRatio
  } else {
    canvas.width = img.width
    canvas.height = img.height
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  
  return ctx
}

// Returns a bounding box that contains all the non-transparent pixels and is a square
// Additionally, it is the correct size such the percentage of non-transparent pixels is close to a target ratio
// (or smaller if the image is not compact enough)
function getSquareBBox(ctx: CanvasRenderingContext2D, alphaThreshold: number, cropWhite: boolean, ratioTarget: number, maxHeight: number) {
  const { bound, pixelCount } = getImageBBox(ctx, alphaThreshold, cropWhite)
  const centerX = (bound.left + bound.right) / 2
  const centerY = (bound.top + bound.bottom) / 2
  const boundSize = Math.max(bound.right - bound.left, bound.bottom - bound.top)
  
  // image ratio = pixelCount / (size^2)
  // target size = sqrt(pixelCount / ratioTarget)
  let targetSize = Math.sqrt(pixelCount / ratioTarget)
  
  // Ensure that the image is not too tall
  const height = bound.bottom - bound.top
  if (height / targetSize > maxHeight) {
    targetSize = height / maxHeight
  }
  
  // If targetSize < size, in order to achieve the target ratio we would need to crop the image.
  // This happens when the object in the image is not compact enough.
  // Losing content is not acceptable, so we use the bounding box instead (the true ratio will be smaller than ratioTarget)
  const cropSize = targetSize < boundSize ? boundSize : targetSize
  
  return {
    x: centerX - cropSize/2,
    y: centerY - cropSize/2,
    size: cropSize,
  }
}

interface Bounds {
  top: number
  left: number
  right: number
  bottom: number
}

function getImageBBox(ctx: CanvasRenderingContext2D, alphaThreshold: number, cropWhite: boolean): { bound: Bounds, pixelCount: number } {
  const pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const bound: Bounds = {
    top: Infinity,
    left: Infinity,
    right: -Infinity,
    bottom: -Infinity,
  }
  let pixelCount = 0

  const whiteThreshold = (256 - alphaThreshold) * 3

  // Iterate over every pixel and update the bounding box
  for (let x = 0; x < ctx.canvas.width; x++) {
    for (let y = 0; y < ctx.canvas.height; y++) {
      // Get the pixel index (width * y + x) and multiply by 4 because each pixel has 4 values (RGBA)
      const i = (y * ctx.canvas.width + x) << 2
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
      pixelCount++
    }
  }
  
  if (!cropWhite && pixelCount > 0.99 * ctx.canvas.width * ctx.canvas.height) {
    // If all pixels are non-transparent, we may have received a PNG/WebP image without transparency
    // Treat it as if it was a JPEG
    return getImageBBox(ctx, alphaThreshold, true)
  }

  return { bound, pixelCount }
}
