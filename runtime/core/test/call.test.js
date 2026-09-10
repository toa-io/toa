import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as fixtures from './call.fixtures.js'
import { Call } from '../source/call.js'
import * as trail from '../source/trail.js'

let call

beforeEach(() => {
  resetCalls()

  call = new Call(fixtures.transmission, fixtures.contract)
})

it('should depend on transmission', () => {
  assert.ok(
    ((invocation) =>
      invocation.arguments.length === 1 &&
      isDeepStrictEqual(invocation.arguments[0], call))(
      fixtures.transmission.link.mock.calls.at(-1) ?? { arguments: [] }
    )
  )
})

it('should call transmission', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  assert.ok(
    fixtures.transmission.request.mock.calls.some(
      (invocation) =>
        invocation.arguments.length === 1 &&
        isDeepStrictEqual(invocation.arguments[0], request)
    )
  )
})

it('should fit request', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  assert.ok(
    ((invocation) =>
      invocation.arguments.length === 1 &&
      isDeepStrictEqual(invocation.arguments[0], request))(
      fixtures.contract.fit.mock.calls.at(-1) ?? { arguments: [] }
    )
  )
})

it('should return reply', async () => {
  const request = fixtures.request().ok

  const reply = await call.invoke(request)

  assert.deepStrictEqual(reply, fixtures.transmission.request.mock.calls[0].result.output)
})

it('should throw received exceptions', async () => {
  const request = fixtures.request().bad

  await assert.rejects(call.invoke(request), (error) => {
    assert.notStrictEqual(error, undefined)
    return true
  })
})

it('should carry the chain the call is made from', async () => {
  const request = fixtures.request().ok
  const hops = ['default.orders.place']

  await trail.follow(hops, async () => call.invoke(request))

  assert.deepStrictEqual(request.trail, hops)
})

it('should leave a chain the caller stamped alone', async () => {
  const request = fixtures.request().ok

  request.trail = ['~default.orders.placed']

  await trail.follow(['default.billing.charge'], async () => call.invoke(request))

  assert.deepStrictEqual(request.trail, ['~default.orders.placed'])
})

it('should start a chain under the name of the service it calls for', async () => {
  const request = fixtures.request().ok
  const service = new Call(fixtures.transmission, fixtures.contract, { service: 'exposition' })

  await service.invoke(request)

  assert.deepStrictEqual(request.trail, ['exposition'])
})

it('should not start one for a call a component makes', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  assert.strictEqual(request.trail, undefined)
})

// one request object is handed to several concurrent calls in more than one place —
// `identity.credentials.list` is three under one `Promise.all` — so the chain is assigned
it('should give concurrent calls sharing one request the same chain', async () => {
  const request = fixtures.request().ok

  await trail.follow(['default.credentials.list'], async () =>
    Promise.all([call.invoke(request), call.invoke(request), call.invoke(request)])
  )

  assert.deepStrictEqual(request.trail, ['default.credentials.list'])
})

function resetCalls(target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
