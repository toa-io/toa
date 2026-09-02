'use strict'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { State } = require('../src/state')
const fixtures = require('./state.fixtures')

let state

beforeEach(() => {
  resetCalls()

  state = new State(fixtures.storage, fixtures.factory, fixtures.outbox)
})

it('should provide object', async () => {
  const entity = await state.object(fixtures.query)

  assert.ok(fixtures.storage.get.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], fixtures.query)))
  assert.deepStrictEqual(entity, fixtures.factory.object.mock.calls[0].result)
  assert.ok(fixtures.factory.object.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], fixtures.storage.get.mock.calls[0].result) && isDeepStrictEqual(call.arguments[1], true)))
})

it('should provide read-only object', async () => {
  await state.object(fixtures.query, false)

  assert.ok(fixtures.factory.object.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], fixtures.storage.get.mock.calls[0].result) && isDeepStrictEqual(call.arguments[1], false)))
})

it('should provide read-only objects', async () => {
  await state.objects(fixtures.query, false)

  assert.ok(fixtures.factory.objects.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], fixtures.storage.find.mock.calls[0].result) && isDeepStrictEqual(call.arguments[1], undefined) && isDeepStrictEqual(call.arguments[2], false)))
})

it('should store entity', async () => {
  await state.commit(fixtures.initial)

  assert.ok(fixtures.storage.store.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], fixtures.initial.get.mock.calls[0].result) && isDeepStrictEqual(call.arguments[1], fixtures.outbox.row.mock.calls[0].result)))
})

it('should publish the row', async () => {
  await state.commit(fixtures.entity)

  assert.ok(fixtures.outbox.row.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], fixtures.entity.event.mock.calls[0].result)))
  assert.ok(fixtures.outbox.publish.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], fixtures.outbox.row.mock.calls[0].result)))
})

it('should not publish if the write did not happen', async () => {
  fixtures.storage.store.mock.mockImplementationOnce(() => false)

  await state.commit(fixtures.entity)

  assert.strictEqual(fixtures.outbox.publish.mock.callCount(), 0)
})

it('should build the row before the write', async () => {
  // the storage commits the row in the same transaction, so it must already exist
  fixtures.storage.store.mock.mockImplementationOnce((_, row) => {
    assert.notStrictEqual(row, undefined)

    return true
  })

  
  await state.commit(fixtures.entity)
})

describe('assignment', () => {
  const changeset = { query: 'q', export: () => ({ foo: 1 }) }

  it('should pass the row to upsert and publish it', async () => {
    const result = await state.apply(changeset, { foo: 1 })

    assert.ok(fixtures.storage.upsert.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], changeset.query) && isDeepStrictEqual(call.arguments[1], { foo: 1 }) && isDeepStrictEqual(call.arguments[2], fixtures.outbox.row.mock.calls[0].result)))

    assert.ok(fixtures.outbox.publish.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], fixtures.outbox.row.mock.calls[0].result)))
    assert.deepStrictEqual(result, fixtures.storage.upsert.mock.calls[0].result)
  })

  it('should fill the state a storage without the outbox left alone', async () => {
    await state.apply(changeset, { foo: 1 })

    const row = fixtures.outbox.row.mock.calls[0].result

    assert.deepStrictEqual(row.event.state, fixtures.storage.upsert.mock.calls[0].result)
    assert.deepStrictEqual(row.event.input, { foo: 1 })
  })
})

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
