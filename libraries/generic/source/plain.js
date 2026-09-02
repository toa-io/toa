/**
 * @param {any} candidate
 * @return {boolean}
 */
function plain (candidate) {
  return candidate?.constructor.name === 'Object'
}

export { plain }
