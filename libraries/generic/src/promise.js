'use strict'

/** @type {toa.generic.promise.constructor} */
const promise = () => {
  let ok
  let oh

  const promise = /** @type {toa.generic.promise.Exposed} */ new Promise((resolve, reject) => {
    ok = resolve
    oh = reject
  })

  promise.resolve = ok
  promise.reject = oh

  return promise
}

exports.promise = promise
