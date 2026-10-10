import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { EntitySet } from '../../source/entities/set.js'
import { generate } from 'randomstring'
import * as fixtures from './set.fixtures.js'

it('should provide state', () => {
  const set = new EntitySet(fixtures.set)
  const state = set.get()
  const expected = fixtures.set.map((entity) => entity.get.mock.calls[0].result)

  assert.deepStrictEqual(state, expected)
})

describe('discard', () => {
  const entity = (DISCARD = false) => {
    const value = { id: generate() }

    Object.defineProperty(value, 'DISCARD', {
      writable: true,
      enumerable: false,
      value: DISCARD
    })

    return {
      get: mock.fn(() => value),
      set: mock.fn(),
      event: mock.fn(() => ({ state: value }))
    }
  }

  it('should set the entities that are not discarded', () => {
    const entities = [entity(), entity()]
    const set = new EntitySet(entities)
    const values = set.get()

    values[1].DISCARD = true
    set.set(values)

    assert.strictEqual(entities[0].set.mock.callCount(), 1)
    assert.strictEqual(entities[1].set.mock.callCount(), 0)
  })

  it('should commit and emit the entities that are not discarded', () => {
    const entities = [entity(), entity()]
    const set = new EntitySet(entities)
    const values = set.get()

    values[0].DISCARD = true
    set.set(values)

    assert.deepStrictEqual(set.get(), [values[1]])
    assert.deepStrictEqual(set.events(), [{ state: values[1] }])
  })
})
