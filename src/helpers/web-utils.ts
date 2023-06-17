
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


// https://stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling
export function isScrolledIntoView(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  const elemTop = rect.top
  const elemBottom = rect.bottom

  // Only completely visible elements return true:
  const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight)
  // Partially visible elements return true:
  //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
  return isVisible
}

export function pageIsScrollable() {
  return document.body.scrollHeight > window.innerHeight
}





let storedCanvas: HTMLCanvasElement | undefined = undefined
/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  * @param {String} text The text to be rendered.
  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
export function getTextWidth(text: string, font?: string) {
  // re-use canvas object for better performance
  const canvas = storedCanvas || (storedCanvas = document.createElement('canvas'))
  const context = canvas.getContext('2d')
  if (!context) return 0
  context.font = font ?? getCanvasFont()
  const metrics = context.measureText(text)
  return metrics.width
}

function getCssStyle(element: HTMLElement, prop: string) {
  return window.getComputedStyle(element, null).getPropertyValue(prop)
}

export function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal'
  const fontSize = getCssStyle(el, 'font-size') || '16px'
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman'
  
  return `${fontWeight} ${fontSize} ${fontFamily}`
}
