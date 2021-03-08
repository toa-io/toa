'use strict'

const { timeout } = require('../src/timeout')

it('should wait', async () => {
  const start = +new Date()
  const ms = Math.floor(Math.random() * 10)

  await timeout(ms)

  const end = +new Date()

  expect(end - start).toBeGreaterThanOrEqual(ms)
})
