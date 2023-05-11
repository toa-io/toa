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
    get: (node, key) => {
      if (key in node) return original(node, key)

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

function original (node, key) {
  const value = node[key]

  // breaks fn.length
  if (typeof value === 'function') return (...args) => value.apply(node, args)
  else return value
}

exports.generate = generate
