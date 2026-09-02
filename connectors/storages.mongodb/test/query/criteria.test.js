import { it } from 'node:test'
import assert from 'node:assert/strict'

import * as fixtures from './criteria.fixtures.js'
import { criteria } from '../../src/translate/criteria.js'

it('should translate', () => {
  const result = criteria(fixtures.ast)

  assert.deepStrictEqual(result, fixtures.criteria)
})
