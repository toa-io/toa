'use strict'

/**
 * @type {toa.libraries.generic.underlay.Constructor}
 */
const underlay = (func) => proxy(func)

/**
 * @param {toa.libraries.generic.underlay.Callback} func
 * @param {string[]} [segments]
 * @returns {toa.libraries.generic.Underlay}
 */
const proxy = (func, segments) => {
  const callable = (...args) => {
    const segs = segments === undefined ? [] : segments

    return func(segs, args)
  }

  return /** @type {toa.libraries.generic.Underlay} */ new Proxy(callable, {
    get: (_, key) => {
      const segs = segments === undefined ? [] : [...segments]

      segs.push(key)

      return proxy(func, segs)
    }
  })
}

exports.underlay = underlay
