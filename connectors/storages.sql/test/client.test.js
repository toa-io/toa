import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'

import * as fixtures from './client.fixtures.js'
import { Client } from '../src/client.js'

let connection

let client

beforeEach(async () => {
  resetCalls()

  connection = /** @type {toa.sql.Connection} */ fixtures.connection

  client = new Client(connection)

  await client.connect()
})

it('should be', () => {
  assert.notStrictEqual(Client, undefined)
})

it('should depend on connection', () => {
  assert.ok(connection.link.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], client)))
})

it('should insert', async () => {
  const object = generate()

  await client.insert(object)

  assert.ok(connection.insert.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], connection.table) && isDeepStrictEqual(call.arguments[1], [object])))
})

it('should batch insert', async () => {
  const a = generate()
  const b = generate()
  const c = generate()

  connection.insert.mock.mockImplementationOnce(() => new Promise(
    (resolve) => setImmediate(() => resolve(true))
  ))

  await Promise.all([
    client.insert(a),
    client.insert(b),
    client.insert(c)
  ])

  assert.strictEqual(connection.insert.mock.callCount(), 2)
  assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], connection.table) && isDeepStrictEqual(call.arguments[1], [a]))(connection.insert.mock.calls[1 - 1] ?? { arguments: [] }))
  assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], connection.table) && isDeepStrictEqual(call.arguments[1], [b, c]))(connection.insert.mock.calls[2 - 1] ?? { arguments: [] }))
})

it('should update', async () => {
  const criteria = generate()
  const object = generate()

  await client.update(criteria, object)

  assert.ok(connection.update.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], connection.table) && isDeepStrictEqual(call.arguments[1], criteria) && isDeepStrictEqual(call.arguments[2], object)))
})

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
