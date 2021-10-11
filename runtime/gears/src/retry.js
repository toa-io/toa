'use strict'

const { timeout } = require('./timeout')
const { merge } = require('./merge')

const retry = async (func, options = {}, attempt = 0) => {
  let inner

  if (options._ === undefined) merge(options, DEFAULTS, { ignore: true })

  const outer = await func(async () => {
    if (attempt === options.retries) throw new Error(`Retry failed after ${attempt} attempts`)

    let interval = Math.min(options.base * Math.pow(options.factor, attempt), options.max)

    if (options.dispersion !== undefined && options.dispersion !== 0) {
      const dispersion = interval * options.dispersion
      interval += dispersion * (Math.random() - 0.5)
    }

    inner = (async () => {
      await timeout(interval)
      return retry(func, options, attempt + 1)
    })()
  }, attempt)

  return inner === undefined ? outer : await inner
}

const DEFAULTS = {
  retries: Infinity,
  factor: 1.5,
  base: 1000,
  max: 30000,
  dispersion: .1,
  _: true
}

exports.retry = retry
