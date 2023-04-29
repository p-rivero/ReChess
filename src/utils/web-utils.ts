
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

