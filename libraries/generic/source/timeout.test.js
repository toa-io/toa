'use strict'

const { performance } = require('perf_hooks')

const { timeout } = require('../source/timeout')

it('should wait', async () => {
  const start = performance.now()
  const ms = Math.floor(Math.random() * 10)

  await timeout(ms)

  const end = performance.now()

  expect(Math.ceil(end - start)).toBeGreaterThanOrEqual(ms)
})
