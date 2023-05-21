export function clone<T>(obj: T): T {
  try {
    return structuredClone(obj)
  } catch (e) {
    return JSON.parse(JSON.stringify(obj))
  }
}

// https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
// eslint-disable-next-line @typescript-eslint/ban-types
export function debounce<T extends Function>(cb: T, wait = 20) {
  let h: NodeJS.Timeout | undefined = undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callable = (...args: any) => {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return callable as unknown as T
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function throttle<T extends Function>(cb: T, wait = 20) {
  let inThrottle = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callable = (...args: any) => {
    if (!inThrottle) {
      cb(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
  return callable as unknown as T
}


// https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function objectEquals(x: any, y: any) {
  if (x === y) return true
  // if both x and y are null or undefined and exactly the same

  if (!(x instanceof Object) || !(y instanceof Object)) return false
  // if they are not strictly equal, they both need to be Objects

  if (x.constructor !== y.constructor) return false
  // they must have the exact same prototype chain, the closest we can do is
  // test there constructor.

  for (const p in x) {
    if (!Object.prototype.hasOwnProperty.call(x, p)) continue
    // other properties were tested using x.constructor === y.constructor

    if (!Object.prototype.hasOwnProperty.call(y, p)) return false
    // allows to compare x[p] and y[p] when set to undefined

    if (x[p] === y[p]) continue
    // if they have the same strict value or identity then they are equal

    if (typeof(x[p]) !== 'object') return false
    // Numbers, Strings, Functions, Booleans must be strictly equal

    if (!objectEquals(x[p],  y[p])) return false
    // Objects and Arrays must be tested recursively
  }

  for (const p in y)
    if (Object.prototype.hasOwnProperty.call(y, p) && !Object.prototype.hasOwnProperty.call(x, p))
      return false
  // allows x[p] to be set to undefined

  return true
}

// Add all properties of the extend object to the base object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge(base: any, extend: any): void {
  for (const key in extend) {
    if (Object.prototype.hasOwnProperty.call(extend, key)) {
      if (Object.prototype.hasOwnProperty.call(base, key) && isPlainObject(base[key]) && isPlainObject(extend[key]))
        deepMerge(base[key], extend[key])
      else base[key] = extend[key]
    }
  }
}
function isPlainObject(o: unknown) {
  if (typeof o !== 'object' || o === null)
    return false
  const proto = Object.getPrototypeOf(o)
  return proto === Object.prototype || proto === null
}
