import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { Entity } from '../../source/entities/entity.js'
import * as fixtures from './entity.fixtures.js'

const BLANK = {}

beforeEach(() => {
  resetCalls()
})

describe('argument', () => {
  it('should set state', () => {
    const state = fixtures.state()
    const entity = new Entity(fixtures.schema, BLANK, state)

    assert.deepStrictEqual(entity.get(), state)
  })

  it('should snapshot the record it may commit', () => {
    const record = fixtures.state()
    const entity = new Entity(fixtures.schema, BLANK, record)

    assert.notStrictEqual(entity.get(), record)
    assert.strictEqual(entity.event().origin, record)
  })
})

describe('blank', () => {
  it('should write what the component declares a record starts as', () => {
    const entity = new Entity(fixtures.schema, { foo: 'declared' })
    const state = entity.get()

    assert.strictEqual(state.foo, 'declared')
    assert.strictEqual(state.VERSION, 0)
    assert.strictEqual(state.DELETED, null)
    assert.strictEqual(typeof state.id, 'string')
    assert.strictEqual(entity.event().origin, null)
  })

  it('should not validate it', () => {
    new Entity(fixtures.schema, { fail: true })

    assert.strictEqual(fixtures.schema.fit.mock.callCount(), 0)
  })

  it('should give every record its own copy', () => {
    const blank = { foo: { bar: 'nested' } }
    const one = new Entity(fixtures.schema, blank)
    const other = new Entity(fixtures.schema, blank)

    assert.notStrictEqual(one.get().foo, other.get().foo)
    assert.notStrictEqual(one.get().foo, blank.foo)
  })
})

describe('read-only', () => {
  it('should take the record as it came', () => {
    const record = fixtures.state()
    const entity = new Entity(fixtures.schema, BLANK, record, undefined, false)

    // no pre-image to diff against, hence no copy of it
    assert.strictEqual(entity.get(), record)
  })

  it('should still report a tombstone', () => {
    const record = { ...fixtures.state(), DELETED: Date.now() }
    const entity = new Entity(fixtures.schema, BLANK, record, undefined, false)

    assert.strictEqual(entity.deleted, true)
  })

  it('should refuse to be modified', () => {
    const entity = new Entity(fixtures.schema, BLANK, fixtures.state(), undefined, false)

    assert.throws(
      () => entity.set(entity.get()),
      (error) => /read-only/.test(error.message)
    )
  })
})

describe('tombstone', () => {
  it('should lift tombstone when transition leaves DELETED untouched', () => {
    const origin = fixtures.state()
    const entity = new Entity(fixtures.schema, BLANK, origin)
    const state = entity.get()

    state.foo = 'revived'
    entity.set(state)

    assert.strictEqual(entity.get().DELETED, null)
    assert.strictEqual(entity.deleted, false)
    assert.strictEqual(entity.event().state.DELETED, null)
  })

  it('should keep tombstone written by transition', () => {
    const origin = { ...fixtures.state(), DELETED: null }
    const entity = new Entity(fixtures.schema, BLANK, origin)
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
  const entity = new Entity(fixtures.schema, BLANK, origin)
  const state = entity.get()

  state.foo = 'new value'
  entity.set(state)

  const event = entity.event()

  assert.partialDeepStrictEqual(event, { state, origin })
  assert.strictEqual(event.state.foo, 'new value')
  assert.strictEqual(event.state.VERSION, 1)
  assert.notStrictEqual(event.origin.foo, 'new value')
})

function resetCalls(target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
