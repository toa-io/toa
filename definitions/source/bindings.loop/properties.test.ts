import { it } from 'node:test'
import assert from 'node:assert/strict'

import { properties } from './index.ts'

it('is synchronous, local, and carries a stream', () => {
  assert.deepStrictEqual(properties, { async: false, local: true, streams: true })
})
