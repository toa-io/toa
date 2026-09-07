import { it } from 'node:test'
import assert from 'node:assert/strict'

import { properties } from './index.js'

it('is asynchronous', () => {
  assert.deepStrictEqual(properties, { async: true })
})
