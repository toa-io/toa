'use strict'

const { retry } = require('../src/')
const { timeout } = require('../src/timeout')
const { random } = require('../src/random')

let options

beforeEach(() => {
  options = { base: 10 }
})

it('should return', async () => {
  const result = await retry(() => 1)
  expect(result).toBe(1)
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
