import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Entity } from '../../source/entities/entity.js'
import * as fixtures from './entity.fixtures.js'

beforeEach(() => {
  resetCalls()
})

describe('argument', () => {
  it('should set state', () => {
    const state = fixtures.state()
    const entity = new Entity(fixtures.schema, state)

    assert.deepStrictEqual(entity.get(), state)
  })

  it('should snapshot the record it may commit', () => {
    const record = fixtures.state()
    const entity = new Entity(fixtures.schema, record)

    assert.notStrictEqual(entity.get(), record)
    assert.strictEqual(entity.event().origin, record)
  })
})

describe('read-only', () => {
  it('should take the record as it came', () => {
    const record = fixtures.state()
    const entity = new Entity(fixtures.schema, record, undefined, false)

    // no pre-image to diff against, hence no copy of it
    assert.strictEqual(entity.get(), record)
  })

  it('should still report a tombstone', () => {
    const record = { ...fixtures.state(), DELETED: Date.now() }
    const entity = new Entity(fixtures.schema, record, undefined, false)

    assert.strictEqual(entity.deleted, true)
  })

  it('should refuse to be modified', () => {
    const entity = new Entity(fixtures.schema, fixtures.state(), undefined, false)

    assert.throws(() => entity.set(entity.get()), (error) => /read-only/.test(error.message))
  })
})

describe('tombstone', () => {
  it('should lift tombstone when transition leaves DELETED untouched', () => {
    const origin = fixtures.state()
    const entity = new Entity(fixtures.schema, origin)
    const state = entity.get()

    state.foo = 'revived'
    entity.set(state)

    assert.strictEqual(entity.get().DELETED, null)
    assert.strictEqual(entity.deleted, false)
    assert.strictEqual(entity.event().state.DELETED, null)
  })

  it('should keep tombstone written by transition', () => {
    const origin = { ...fixtures.state(), DELETED: null }
    const entity = new Entity(fixtures.schema, origin)
    const state = entity.get()
    const timestamp = Date.now()

    state.DELETED = timestamp
    entity.set(state)

    assert.strictEqual(entity.get().DELETED, timestamp)
    assert.strictEqual(entity.deleted, true)
  })
})

it('should provide event', () => {
  const origin = fixtures.state()
  const entity = new Entity(fixtures.schema, origin)
  const state = entity.get()

  state.foo = 'new value'
  entity.set(state)

  const event = entity.event()

  assert.partialDeepStrictEqual(event, { state, origin })
  assert.strictEqual(event.state.foo, 'new value')
  assert.strictEqual(event.state.VERSION, 1)
  assert.notStrictEqual(event.origin.foo, 'new value')
})

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
