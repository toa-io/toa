import { it } from 'node:test'
import assert from 'node:assert/strict'

import { performance } from 'perf_hooks'

import { timeout } from '../source/timeout.js'

it('should wait', async () => {
  const start = performance.now()
  const ms = Math.floor(Math.random() * 10)

  await timeout(ms)

  const end = performance.now()

  assert.ok(Math.ceil(end - start) >= ms)
})
