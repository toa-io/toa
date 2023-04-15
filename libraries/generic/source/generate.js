'use strict'

/**
 * @param {function} generator
 */
function generate (generator) {
  return proxy({}, generator)
}

/**
 * @param {any} value
 * @param {function} generator
 * @param {string[]} [segments]
 */
function proxy (value, generator, segments = []) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value

  return new Proxy(value, {
    get: (_, key) => {
      segments.push(key)

      const value = generator(segments)

      return proxy(value, generator, segments)
    },
    set: (_, key, value) => {
      segments.push(key)
      generator(segments, value)

      return true
    }
  })
}

exports.generate = generate
