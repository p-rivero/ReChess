export function paramToInt(param: string|string[]): number|undefined {
  // If the param is an array, return the first element
  if (Array.isArray(param)) return paramToInt(param[0])
  const num = Number(param)
  if (Number.isNaN(num)) return undefined
  return num
}
