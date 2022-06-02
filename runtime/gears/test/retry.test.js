'use strict'

const { retry, RetryError, timeout, random } = require('../src/')

/** @type {toa.gears.retry.Options} */
let options

beforeEach(() => {
  options = { base: 10 }
})

it('should return', async () => {
  const value = random()
  const result = await retry(() => value)

  expect(result).toBe(value)
})

it('should retry', async () => {
  const fn = (attempt) => attempt === 5

  const result = await retry((retry, attempt) => {
    const ok = fn(attempt)

    if (ok === false) retry()

    return 'ok' + attempt
  }, options)

  expect(result).toBe('ok5')
})

it('should retry async', async () => {
  const fn = async (attempt) => {
    await timeout(10)
    return attempt === 5
  }

  const result = await retry(async (retry, attempt) => {
    const ok = await fn(attempt)

    if (ok === false) retry()

    return 'ok' + attempt
  }, options)

  expect(result).toBe('ok5')
})

it('should throw on failed retries', async () => {
  options.retries = random(10)

  await expect(() => retry((retry) => retry(), options))
    .rejects.toThrow(new RegExp(`Retry failed after ${options.retries} attempts`))
})

it('should delay attempts', async () => {
  const start = +new Date()

  /** @type {toa.gears.retry.Task} */
  const fn = (retry, attempt) => {
    if (attempt < 3) retry()
  }

  await retry(fn, { base: 100, dispersion: 0 })

  const end = +new Date()

  expect(end - start > 470).toBe(true)
  expect(end - start < 500).toBe(true)
})

it('should retry given times', async () => {
  const retries = random(10)

  // noinspection JSCheckFunctionSignatures
  const fn = jest.fn((retry) => retry())

  await expect(retry(fn, { retries, base: 0 })).rejects.toThrow(RetryError)
  expect(fn).toHaveBeenCalledTimes(retries + 1)
})
