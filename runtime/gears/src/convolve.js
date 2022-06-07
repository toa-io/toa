'use strict'

/**
 * @param {Object} object
 * @param {string} [dimension]
 * @returns {Object}
 */
const convolve = (object, dimension) => {
  if (typeof object !== 'object') return object

  for (let [key, value] of Object.entries(object)) {
    value = convolve(value, dimension)

    if (key.includes('@')) {
      const [name, tag] = key.split('@')

      if (tag === dimension) object[name] = value

      delete object[key]
    }
  }

  return object
}

exports.convolve = convolve
