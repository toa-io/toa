'use strict'

/** @type {toa.generic.promise.constructor} */
const promise = () => {
  let ok
  let oh

  const promise = /** @type {toa.generic.promise.Exposed} */
    new Promise((resolve, reject) => {
      ok = resolve
      oh = reject
    })

  function callback (error, result) {
    if (error !== undefined) oh(error)
    else ok(result)
  }

  promise.resolve = ok
  promise.reject = oh
  promise.callback = callback

  return promise
}

exports.promise = promise
