export function clone<T>(obj: T): T {
  try {
    return structuredClone(obj)
  } catch (e) {
    return JSON.parse(JSON.stringify(obj))
  }
}

/**
 * Waits until the input signal stabilizes for a given time before calling the callback
 * @param cb Callback (function to debounce)
 * @param wait Time to wait before calling the callback
 * @see https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
 */
export function debounce<T extends (...args: Parameters<T>)=>ReturnType<T>>(cb: T, wait = 20): (...args: Parameters<T>) => void {
  let h: NodeJS.Timeout | undefined = undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callable = (...args: Parameters<T>) => {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return callable
}

/**
 * Calls the callback immediately and then waits a given time before the callback can be called again
 * @param cb Callback (function to throttle)
 * @param wait Time to wait before calling the callback again
 */
export function throttle<T extends (...args: Parameters<T>)=>ReturnType<T>>(cb: T, wait = 20): (...args: Parameters<T>) => ReturnType<T>|undefined {
  let inThrottle = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callable = (...args: Parameters<T>) => {
    if (!inThrottle) {
      const ret = cb(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
      return ret
    }
  }
  return callable
}


/**
 * Deeply compares two objects and returns true if they are equal
 * @param x An object
 * @param y Object to compare with
 * @see https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
 */
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

/**
 * Add all properties of the extend object to the base object, recursively
 * @param base Object to extend
 * @param extend All properties of this object will be added to the base object
 */
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

/**
 * Given 2 arrays, returns the intersection of the two. Also, removes the intersection from both arrays.
 * @param a First array (will be modified)
 * @param b Second array (will be modified)
 * @see https://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
 */
export function intersection<T>(a: T[], b: T[]): T[] {
  const intersection = a.filter(x => b.includes(x))
  a = a.filter(x => !intersection.includes(x))
  b = b.filter(x => !intersection.includes(x))
  return intersection
}
