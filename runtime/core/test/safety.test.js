import { it, beforeEach, describe } from 'node:test'
import assert from 'node:assert/strict'

import * as fixtures from './call.fixtures.js'
import { Call } from '../source/call.js'
import { safe } from '../source/safety.js'
import { codes, permanent, SafetyException } from '../source/exceptions.js'
import * as trail from '../source/trail.js'

const TARGET = 'default.orders.place'

/** the envelope the call handed to the transmission, or nothing where it handed none */
const sent = () => fixtures.transmission.request.mock.calls.at(-1)?.arguments[0]

/** as `Component.invoke` enters one */
const serving = (readonly) => ({ hops: [TARGET], calls: new Map(), readonly })

beforeEach(() => {
  fixtures.transmission.request.mock.resetCalls()
})

describe('classification', () => {
  it('should answer for every type', () => {
    assert.deepStrictEqual(
      {
        transition: safe('transition'),
        observation: safe('observation'),
        assignment: safe('assignment'),
        computation: safe('computation'),
        effect: safe('effect'),
        unmanaged: safe('unmanaged')
      },
      {
        transition: false,
        observation: true,
        assignment: false,
        computation: true,
        effect: false,
        unmanaged: false
      }
    )
  })

  // a manifest the runtime cannot classify is one it does not vouch for
  it('should answer false for a type it does not know', () => {
    assert.strictEqual(safe(undefined), false)
    assert.strictEqual(safe('whatever'), false)
  })

  /*
   * What a later attempt would meet is the same endpoint and the same request, so a message that
   * hits this is set aside at once rather than retried — a delayed call whose stored request may
   * only read is dropped on its first dispatch rather than on every scan until it expires.
   */
  it('should be permanent', () => {
    assert.strictEqual(permanent(new SafetyException()), true)
  })
})

describe('an unsafe endpoint', () => {
  let call

  beforeEach(() => {
    call = new Call(fixtures.transmission, fixtures.contract, TARGET, undefined, false, false)
  })

  it('should be called where nothing says otherwise', async () => {
    await call.invoke(fixtures.request().ok)

    assert.notStrictEqual(sent(), undefined)
  })

  it('should refuse a readonly request', async () => {
    await assert.rejects(call.invoke({ ...fixtures.request().ok, readonly: true }), {
      code: codes.Safety
    })
  })

  it('should be refused before anything is sent', async () => {
    await call.invoke({ ...fixtures.request().ok, readonly: true }).catch(() => undefined)

    assert.strictEqual(sent(), undefined)
  })

  it('should refuse a call made under a readonly invocation', async () => {
    await assert.rejects(
      trail.follow(serving(true), async () => call.invoke(fixtures.request().ok)),
      { code: codes.Safety }
    )
  })

  // the flag is the framework's: a caller that states otherwise is held to it all the same
  it('should refuse a call that states otherwise under one', async () => {
    await assert.rejects(
      trail.follow(serving(true), async () =>
        call.invoke({ ...fixtures.request().ok, readonly: false })
      ),
      { code: codes.Safety }
    )
  })

  it('should be called under an invocation that is not readonly', async () => {
    await trail.follow(serving(undefined), async () => call.invoke(fixtures.request().ok))

    assert.notStrictEqual(sent(), undefined)
  })
})

describe('a safe endpoint', () => {
  let call

  beforeEach(() => {
    call = new Call(fixtures.transmission, fixtures.contract, TARGET, undefined, false, true)
  })

  it('should be called under a readonly invocation', async () => {
    await trail.follow(serving(true), async () => call.invoke(fixtures.request().ok))

    assert.notStrictEqual(sent(), undefined)
  })

  it('should carry the flag onward', async () => {
    await trail.follow(serving(true), async () => call.invoke(fixtures.request().ok))

    assert.strictEqual(sent().readonly, true)
  })

  it('should carry the flag a caller stated', async () => {
    await call.invoke({ ...fixtures.request().ok, readonly: true })

    assert.strictEqual(sent().readonly, true)
  })

  // nothing carries a key it has no value for onto the wire
  it('should carry no flag where the call may write', async () => {
    await call.invoke({ ...fixtures.request().ok, readonly: false })

    assert.ok(!('readonly' in sent()))
  })
})
