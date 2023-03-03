'use strict'

/**
 * @param {() => any} fn
 * @param {(e?: error) => Promise<boolean>} recover
 */
const failsafe = async (fn, recover) => {
  try {
    return await fn()
  } catch (exception) {
    if (await recover(exception) === false) throw exception

    return failsafe(fn, recover)
  }
}

exports.failsafe = failsafe
