'use strict'

/**
 * @param {Function} func
 * @returns {toa.gears.Underlay}
 */
const underlay = (func) => proxy(func)

/**
 * @param {Function} func
 * @param {string[]} [path]
 * @returns {toa.gears.Underlay}
 */
const proxy = (func, path) => {
  const callable = (...args) => {
    const cursor = path === undefined ? [] : path

    if (args.length > 0) cursor.push(...args)

    if (func.length > 0 && func.length !== cursor.length) {
      throw new Error(`gears/underlay: arguments length mismatch (${func.length} expected, ${cursor.length} given)`)
    }

    return func.apply(null, cursor)
  }

  // noinspection JSValidateTypes
  return new Proxy(callable, {
    get: (_, key) => {
      const cursor = path === undefined ? [] : path

      cursor.push(key)

      return proxy(func, cursor)
    }
  })
}

exports.underlay = underlay
