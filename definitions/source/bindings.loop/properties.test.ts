import { it } from 'node:test'
import assert from 'node:assert/strict'

import { properties } from './index.js'

it('is synchronous and local', () => {
  assert.deepStrictEqual(properties, { async: false, local: true })
})
