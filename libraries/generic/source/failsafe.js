'use strict'

/** @type {toa.generic.failsafe} */
const failsafe = (context, recover, method = undefined) => {
  if (method === undefined) {
    method = recover
    recover = undefined
  }

  return async function call (...args) {
    if (context[DISABLED] === true) return await method.apply(context, args)

    try {
      return await method.apply(context, args)
    } catch (exception) {
      if (recover !== undefined && await recover.call(context, exception) === false) throw exception

      return call.apply(this, args)
    }
  }
}

failsafe.disable = (context) => {
  context[DISABLED] = true
}

const DISABLED = Symbol('disabled')

exports.failsafe = /** @type {toa.generic.Failsafe} */ failsafe
