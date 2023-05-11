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
  if (value?.constructor.name !== 'Object') return value

  return new Proxy(value, {
    get: (node, key) => {
      const next = [...segments, key]
      const value = generator(next)

      return proxy(value, generator, next)
    },
    set: (_, key, value) => {
      const next = [...segments, key]

      generator(next, value)

      return true
    }
  })
}

exports.generate = generate
