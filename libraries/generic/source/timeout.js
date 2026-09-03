/** @type {toa.generic.Timeout} */
export const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
