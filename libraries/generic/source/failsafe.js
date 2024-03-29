'use strict'

/** @type {toa.generic.failsafe} */
const failsafe = (context, recover, method = undefined) => {
  // two arguments passed
  if (method === undefined) {
    method = recover
    recover = undefined
  }

  return async function call (...args) {
    if (call[DISABLED] === true) return await method.apply(context, args)

    try {
      return await method.apply(context, args)
    } catch (exception) {
      if (recover !== undefined && await recover.call(context, exception) === false) throw exception

      return call.apply(this, args)
    }
  }
}

failsafe.disable = (...methods) => {
  for (const method of methods) method[DISABLED] = true
}

const DISABLED = Symbol('disabled')

exports.failsafe = /** @type {toa.generic.Failsafe} */ failsafe
