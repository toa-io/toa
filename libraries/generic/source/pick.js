/**
 * @param {object} source
 * @param {string[]} properties
 * @return {object}
 */
export function pick (source, properties) {
  return properties.reduce((output, key) => {
    output[key] = source[key]

    return output
  }, {})
}
