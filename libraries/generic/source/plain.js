/**
 * @param {any} candidate
 * @return {boolean}
 */
export function plain (candidate) {
  return candidate?.constructor.name === 'Object'
}
