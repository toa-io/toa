'use strict'

const { timeout } = require('./timeout')

/**
 * @type {toa.generic.Retry}
 */
const retry = async (func, options = {}, attempt = 0) => {
  if (attempt === 0) options = Object.assign({}, DEFAULTS, options)

  let inner

  const outer = await func(async () => {
    if (attempt === options.retries) throw new RetryError(`Retry failed after ${attempt} attempts`)

    inner = (async () => {
      const interval = Math.min(options.base * Math.pow(options.factor, attempt), options.max)
      const dispersion = interval * options.dispersion * (Math.random() - 0.5)
      await timeout(interval + dispersion)

      return retry(func, options, attempt + 1)
    })()
  }, attempt)

  return inner === undefined ? outer : await inner
}

class RetryError extends Error {}

/** @type {toa.generic.retry.Options} */
const DEFAULTS = {
  retries: 5,
  base: 1000,
  factor: 1.5,
  max: 30000,
  dispersion: 0.1
}

exports.retry = retry
exports.retry.Error = RetryError
exports.RetryError = RetryError
