import { it } from 'node:test'
import assert from 'node:assert/strict'

import { EntitySet } from '../../source/entities/set.js'
import * as fixtures from './set.fixtures.js'

it('should provide state', () => {
  const set = new EntitySet(fixtures.set)
  const state = set.get()
  const expected = fixtures.set.map((entity) => entity.get.mock.calls[0].result)

  assert.deepStrictEqual(state, expected)
})
