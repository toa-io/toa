'use strict'

const { performance } = require('perf_hooks')

const { timeout } = require('../src/timeout')

it('should wait', async () => {
  const start = performance.now()
  const ms = Math.floor(Math.random() * 10)

  await timeout(ms)

  const end = performance.now()

  expect(Math.round(end - start)).toBeGreaterThanOrEqual(ms)
})
