import { it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'

import * as fixtures from './factory.fixtures.js'
const mock = fixtures.mock

mocking.module('../../src/entities/entity', { namedExports: ({ Entity: mock.Entity }) })
mocking.module('../../src/entities/set', { namedExports: ({ EntitySet: mock.EntitySet }) })

const { Factory } = await import('../../src/entities/factory.js')


let factory

beforeEach(async () => {
  resetCalls()
  fixtures.entities.length = 0

  factory = new Factory(fixtures.schema, () => fixtures.storage.id())
})

it('should create initial', () => {
  const id = generate()
  const initial = factory.init(id)

  assert.ok(initial instanceof mock.Entity)
  assert.ok(mock.Entity.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], fixtures.schema) && isDeepStrictEqual(call.arguments[1], id) && typeof call.arguments[2] === 'function'))
})

it('should create instance', () => {
  const object = factory.object(fixtures.entity)

  assert.ok(object instanceof mock.Entity)
  assert.ok(mock.Entity.mock.calls.some((call) => call.arguments.length === 4 && isDeepStrictEqual(call.arguments[0], fixtures.schema) && isDeepStrictEqual(call.arguments[1], fixtures.entity) && typeof call.arguments[2] === 'function' && isDeepStrictEqual(call.arguments[3], true)))
})

it('should create set', () => {
  const objects = factory.objects(fixtures.set)

  assert.ok(objects instanceof mock.EntitySet)

  const instances = fixtures.set.map((entity, index) => {
    assert.ok(((call) => call.arguments.length === 4 && isDeepStrictEqual(call.arguments[0], fixtures.schema) && isDeepStrictEqual(call.arguments[1], entity) && typeof call.arguments[2] === 'function' && isDeepStrictEqual(call.arguments[3], true))(mock.Entity.mock.calls[index + 1 - 1] ?? { arguments: [] }))

    return fixtures.entities[index]
  })

  assert.ok(mock.EntitySet.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], instances)))
})

function resetCalls (target = [assert, fixtures, mock], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
