export function clone<T>(obj: T): T {
  try {
    return structuredClone(obj)
  } catch (e) {
    return JSON.parse(JSON.stringify(obj))
  }
}

// https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
export function debounce<T extends Function>(cb: T, wait = 20) {
  let h: NodeJS.Timeout | undefined = undefined
  const callable = (...args: any) => {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return callable as any as T
}

// https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
export function object_equals(x: any, y: any) {
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

    if (!object_equals(x[p],  y[p])) return false
      // Objects and Arrays must be tested recursively
  }

  for (const p in y)
    if (Object.prototype.hasOwnProperty.call(y, p) && !Object.prototype.hasOwnProperty.call(x, p))
      return false
        // allows x[p] to be set to undefined

  return true
}
