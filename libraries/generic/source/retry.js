import { timeout } from './timeout.js'

/**
 * @type {toa.generic.Retry}
 */
export const retry = async (func, options = {}, attempt = 0) => {
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

export class RetryError extends Error {}

/** @type {toa.generic.retry.Options} */
const DEFAULTS = {
  retries: 5,
  base: 1000,
  factor: 1.5,
  max: 30000,
  dispersion: 0.1
}


retry.Error = RetryError
