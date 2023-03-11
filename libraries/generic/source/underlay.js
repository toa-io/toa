'use strict'

/**
 * @type {toa.generic.underlay.Constructor}
 */
const underlay = (func) => proxy(func)

/**
 * @param {toa.generic.underlay.Callback} func
 * @param {string[]} [segments]
 * @returns {toa.generic.Underlay}
 */
const proxy = (func, segments) => {
  const callable = (...args) => {
    const segs = segments === undefined ? [] : segments

    return func(segs, args)
  }

  return /** @type {toa.generic.Underlay} */ new Proxy(callable, {
    get: (_, key) => {
      const segs = segments === undefined ? [] : [...segments]

      segs.push(key)

      return proxy(func, segs)
    }
  })
}

exports.underlay = underlay
