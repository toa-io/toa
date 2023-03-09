'use strict'

/**
 * @param {Object} object
 * @param {string} [discriminator]
 * @returns {Object}
 * @example
 * // returns { foo: 'bar' }
 * convolve({ foo: 'bar', 'foo@staging': 'baz' })
 *
 * // returns { foo: 'baz' }
 * convolve({ foo: 'bar', 'foo@staging': 'baz' }, 'staging')
 */
const convolve = (object, discriminator) => {
  if (typeof object !== 'object' || object === null) return object

  for (let [key, value] of Object.entries(object)) {
    value = convolve(value, discriminator)

    if (key.includes(MARKER)) {
      const [name, tag] = key.split(MARKER)

      if (name.length === 0) continue
      if (tag === discriminator) object[name] = value

      delete object[key]
    }
  }

  return object
}

const MARKER = '@'

exports.convolve = convolve
