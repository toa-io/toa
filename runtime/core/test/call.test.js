import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as fixtures from './call.fixtures.js'
import { Call } from '../source/call.js'

let call

beforeEach(() => {
  resetCalls()

  call = new Call(fixtures.transmission, fixtures.contract)
})

it('should depend on transmission', () => {
  assert.ok(((invocation) => invocation.arguments.length === 1 && isDeepStrictEqual(invocation.arguments[0], call))(fixtures.transmission.link.mock.calls.at(-1) ?? { arguments: [] }))
})

it('should call transmission', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  assert.ok(fixtures.transmission.request.mock.calls.some((invocation) => invocation.arguments.length === 1 && isDeepStrictEqual(invocation.arguments[0], request)))
})

it('should fit request', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  assert.ok(((invocation) => invocation.arguments.length === 1 && isDeepStrictEqual(invocation.arguments[0], request))(fixtures.contract.fit.mock.calls.at(-1) ?? { arguments: [] }))
})

it('should return reply', async () => {
  const request = fixtures.request().ok

  const reply = await call.invoke(request)

  assert.deepStrictEqual(reply, fixtures.transmission.request.mock.calls[0].result.output)
})

it('should throw received exceptions', async () => {
  const request = fixtures.request().bad

  await assert.rejects(call.invoke(request), (error) => { assert.notStrictEqual(error, undefined); return true })
})

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
