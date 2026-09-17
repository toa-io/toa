import { it } from 'node:test'
import assert from 'node:assert/strict'

import { properties } from './index.ts'

it('carries a stream, and nothing asynchronously', () => {
  assert.deepStrictEqual(properties, { async: false, streams: true })
})
