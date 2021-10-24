'use strict'

const underlay = (fn) => proxy(fn)

const proxy = (callback, path) => {
  const callable = (...args) => {
    const cursor = path === undefined ? [] : path

    if (args.length > 0) cursor.push(...args)

    if (callback.length > 0 && callback.length !== cursor.length) {
      throw new Error(`gears/underlay: arguments length mismatch (${callback.length} expected, ${cursor.length} given)`)
    }

    return callback.apply(null, cursor)
  }

  return new Proxy(callable, {
    get: (_, key) => {
      const cursor = path === undefined ? [] : path

      cursor.push(key)

      return proxy(callback, cursor)
    }
  })
}

exports.underlay = underlay
