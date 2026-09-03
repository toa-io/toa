import { it } from 'node:test'
import assert from 'node:assert/strict'

import * as index from '../src/index.js'

it('should export Factory', () => {
  assert.notStrictEqual(index.Factory, undefined)
})
