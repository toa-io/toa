'use strict'

const underlay = (fn) => proxy(fn, fn.length)

const proxy = (fn, depth, path) => {
  return new Proxy({}, {
    get: (_, key) => {
      const cursor = path === undefined ? [] : path

      cursor.push(key)

      if (depth === 2) {
        return (...args) => {
          cursor.push(args)

          return fn.apply(null, cursor)
        }
      } else return proxy(fn, depth - 1, cursor)
    }
  })
}

exports.underlay = underlay
