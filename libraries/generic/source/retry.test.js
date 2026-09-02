'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')

const { retry, RetryError, timeout, random } = require('../source')

/** @type {toa.generic.retry.Options} */
let options

beforeEach(() => {
  options = { base: 10 }
})

it('should return', async () => {
  const value = random()
  const result = await retry(() => value)

  assert.strictEqual(result, value)
})

it('should retry', async () => {
  const fn = (attempt) => attempt === 5

  const result = await retry((retry, attempt) => {
    const ok = fn(attempt)

    if (ok === false) retry()

    return 'ok' + attempt
  }, options)

  assert.strictEqual(result, 'ok5')
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

  assert.strictEqual(result, 'ok5')
})

it('should throw on failed retries', async () => {
  options.retries = random(10)

  await assert.rejects(() => retry((retry) => retry(), options), new RegExp(`Retry failed after ${options.retries} attempts`))
})

it('should delay attempts', async () => {
  const start = +new Date()

  /** @type {toa.generic.retry.Task} */
  const fn = (retry, attempt) => {
    if (attempt < 3) retry()
  }

  await retry(fn, { base: 100, dispersion: 0 })

  const end = +new Date()

  assert.strictEqual(end - start > 470, true)
  // FIXME: it may take longer on CI
  // expect(end - start < 500).toBe(true)
})

it('should retry given times', async () => {
  const retries = random(10)

  // noinspection JSCheckFunctionSignatures
  const fn = mock.fn((retry) => retry())

  await assert.rejects(retry(fn, { retries, base: 0 }), RetryError)
  assert.strictEqual(fn.mock.callCount(), retries + 1)
})
