'use strict'

/**
 * @type {toa.gears.underlay.Constructor}
 */
const underlay = (func) => proxy(func)

/**
 * @param {toa.gears.underlay.Callback | Function} func
 * @param {string[]} [segments]
 * @returns {toa.gears.Underlay}
 */
const proxy = (func, segments) => {
  const callable = (...args) => {
    const segs = segments === undefined ? [] : segments

    return func(segs, args)
  }

  return /** @type {toa.gears.Underlay} */ new Proxy(callable, {
    get: (_, key) => {
      const segs = segments === undefined ? [] : [...segments]

      segs.push(key)

      return proxy(func, segs)
    }
  })
}

exports.underlay = underlay
