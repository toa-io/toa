'use strict'

/**
 * @returns {toa.generic.Promex}
 */
const promex = () => {
  let ok
  let oh

  const promise =
    new Promise((resolve, reject) => {
      ok = resolve
      oh = reject
    })

  function callback (error, result) {
    if (error) oh(error)
    else ok(result)
  }

  const exposition = {
    resolve: ok,
    reject: oh,
    callback
  }

  return /** @type {toa.generic.Promex} */ Object.assign(promise, exposition)
}

exports.promex = promex
