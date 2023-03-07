export function clone<T>(obj: T): T {
  try {
    return structuredClone(obj)
  } catch (e) {
    return JSON.parse(JSON.stringify(obj))
  }
}

export function paramToInt(param: string|string[]): number {
  // If the param is an array, return the first element
  if (Array.isArray(param)) return paramToInt(param[0])
  const num = Number(param)
  return num
}

// https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
export function debounce<T extends Function>(cb: T, wait = 20) {
  let h: NodeJS.Timeout | undefined = undefined
  let callable = (...args: any) => {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return callable as any as T
}

// Assume the font size will not change
let fontSz: number | undefined = undefined
export function remToPx(rem: number): number {
  if (fontSz === undefined) fontSz = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return rem * fontSz;
}
