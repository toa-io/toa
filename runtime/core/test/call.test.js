import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as fixtures from './call.fixtures.js'
import { Call } from '../source/call.js'
import * as trail from '../source/trail.js'

const TARGET = 'default.orders.place'

let call

beforeEach(() => {
  resetCalls()

  call = new Call(fixtures.transmission, fixtures.contract, TARGET)
})

/** the envelope the call handed to the transmission */
const sent = () => fixtures.transmission.request.mock.calls.at(-1)?.arguments[0]

/** as `Component.invoke` enters one */
const serving = (id, hops = ['default.orders.place']) => ({ hops, id, calls: new Map() })

it('should depend on transmission', () => {
  assert.ok(
    ((invocation) =>
      invocation.arguments.length === 1 &&
      isDeepStrictEqual(invocation.arguments[0], call))(
      fixtures.transmission.link.mock.calls.at(-1) ?? { arguments: [] }
    )
  )
})

it('should call transmission with what the caller asked for', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  assert.deepStrictEqual(sent().input, request.input)
  assert.deepStrictEqual(sent().query, request.query)
})

it('should fit the envelope', async () => {
  await call.invoke(fixtures.request().ok)

  assert.deepStrictEqual(fixtures.contract.fit.mock.calls.at(-1)?.arguments[0], sent())
})

it('should return reply', async () => {
  const reply = await call.invoke(fixtures.request().ok)

  assert.deepStrictEqual(reply, fixtures.transmission.request.mock.calls[0].result.output)
})

it('should throw received exceptions', async () => {
  await assert.rejects(call.invoke(fixtures.request().bad), (error) => {
    assert.notStrictEqual(error, undefined)
    return true
  })
})

/*
 * The envelope is the runtime's own object. A caller may hand one request to several calls —
 * `identity.credentials.list` is three under one `Promise.all` — and writing an identity onto
 * it would make all but the first a duplicate of the first.
 */
it('should not write onto the caller request', async () => {
  const request = fixtures.request().ok
  const before = structuredClone(request)

  await trail.follow(serving('a1'), async () => call.invoke(request))

  assert.deepStrictEqual(request, before)
})

it('should mint an identity where nothing is being served', async () => {
  await call.invoke(fixtures.request().ok)

  assert.match(sent().id, /^[\da-f]{32}$/)
})

it('should keep an identity the caller gave it', async () => {
  const request = fixtures.request().ok

  request.id = 'a'.repeat(32)

  await trail.follow(serving('a1'), async () => call.invoke(request))

  assert.strictEqual(sent().id, request.id)
})

it('should derive an identity from the call being served', async () => {
  const identities = []

  for (const _ of [0, 1])
    await trail.follow(serving('a1'), async () => {
      await call.invoke(fixtures.request().ok)
      identities.push(sent().id)
    })

  // the same call served twice makes the same call here twice, and it is one call
  assert.strictEqual(identities[0], identities[1])
  assert.match(identities[0], /^[\da-f]{32}$/)
})

it('should give two calls to one endpoint identities of their own', async () => {
  const identities = []

  await trail.follow(serving('a1'), async () => {
    for (const _ of [0, 1]) {
      await call.invoke(fixtures.request().ok)
      identities.push(sent().id)
    }
  })

  assert.notStrictEqual(identities[0], identities[1])
})

it('should give concurrent calls sharing one request identities of their own', async () => {
  const request = fixtures.request().ok

  await trail.follow(serving('a1'), async () => {
    await Promise.all([call.invoke(request), call.invoke(request), call.invoke(request)])
  })

  const identities = fixtures.transmission.request.mock.calls.map(
    (invocation) => invocation.arguments[0].id
  )

  assert.strictEqual(new Set(identities).size, 3)
})

it('should give two targets identities of their own', async () => {
  const other = new Call(
    fixtures.transmission,
    fixtures.contract,
    'default.stock.reserve'
  )
  const identities = []

  await trail.follow(serving('a1'), async () => {
    await call.invoke(fixtures.request().ok)
    identities.push(sent().id)

    await other.invoke(fixtures.request().ok)
    identities.push(sent().id)
  })

  assert.notStrictEqual(identities[0], identities[1])
})

it('should carry the chain the call is made from', async () => {
  const hops = ['default.orders.place']

  await trail.follow(serving('a1', hops), async () => call.invoke(fixtures.request().ok))

  assert.deepStrictEqual(sent().trail, hops)
})

it('should leave a chain the caller stamped alone', async () => {
  const request = fixtures.request().ok

  request.trail = ['~default.orders.placed']

  await trail.follow(serving('a1', ['default.billing.charge']), async () =>
    call.invoke(request)
  )

  assert.deepStrictEqual(sent().trail, ['~default.orders.placed'])
})

it('should start a chain under the name of the service it calls for', async () => {
  const service = new Call(fixtures.transmission, fixtures.contract, TARGET, {
    service: 'exposition'
  })

  await service.invoke(fixtures.request().ok)

  assert.deepStrictEqual(sent().trail, ['exposition'])
})

it('should not start one for a call a component makes', async () => {
  await call.invoke(fixtures.request().ok)

  assert.strictEqual(sent().trail, undefined)
})

function resetCalls(target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
