'use strict'

const underlay = (fn) => proxy(fn, fn.length)

const proxy = (fn, depth, path = []) => {
  return new Proxy({}, {
    get: (_, key) => {
      path.push(key)

      if (depth === 2) {
        return (...args) => {
          path.push(args)

          return fn.apply(null, path)
        }
      } else return proxy(fn, depth - 1, path)
    }
  })
}

exports.underlay = underlay
