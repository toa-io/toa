import { it } from 'node:test'
import assert from 'node:assert/strict'

import { properties } from '../transpiled/index.js'

it('should export properties', async () => {
  assert.deepStrictEqual(properties, { async: true })
})
