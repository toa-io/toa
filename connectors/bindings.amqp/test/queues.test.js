import { describe, it, beforeEach, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { environment } from '@toa.io/generic'

import { bound, inbound, instances, name, outbound, scoped, tasks } from '../source/queues.js'
import {
  queue,
  CHANNEL,
  INBOUND,
  OUTBOUND
} from '@toa.io/definitions/extensions.convergence'

/** @type {import('@toa.io/core').Locator} */
let locator

const endpoint = generate()

beforeEach(() => {
  locator = /** @type {import('@toa.io/core').Locator} */ {
    name: generate(),
    namespace: generate()
  }
})

it('should be', async () => {
  assert.ok(name instanceof Function)
})

it('should name a queue', async () => {
  const queue = name(locator, endpoint)

  assert.deepStrictEqual(queue, `${locator.namespace}.${locator.name}.${endpoint}`)
})

it('should name a queue with nameless locator', async () => {
  delete locator.name

  const queue = name(locator, endpoint)

  assert.deepStrictEqual(queue, `${locator.namespace}.${endpoint}`)
})

it('should name what an operator is told to declare', () => {
  // a region's queues are declared before it runs anything, from `toa export convergence`,
  // and what it prints is asserted here: one that exists under another name is one the
  // binding never consumes, and the records for that component are dropped upstream
  assert.equal(inbound(CHANNEL), INBOUND)
  assert.equal(outbound(CHANNEL), OUTBOUND)
  assert.equal(bound(CHANNEL, 'store.orders'), queue('store.orders'))
})

describe('under a suffix', () => {
  /** @type {Array<[string, string | undefined]>} */
  let saved

  before(() => {
    saved = ['TOA_CONTEXT', 'TOA_SUFFIX'].map((name) => [name, environment.get(name)])

    environment.set('TOA_CONTEXT', 'app')
    environment.set('TOA_SUFFIX', '-copy')
  })

  after(() => {
    for (const [name, value] of saved)
      if (value === undefined) environment.delete(name)
      else environment.set(name, value)
  })

  it('should begin every name with the scope', () => {
    const { namespace, name: component } = locator

    assert.equal(name(locator, endpoint), `app-copy.${namespace}.${component}.${endpoint}`)
    assert.equal(tasks(locator), `app-copy.${namespace}.${component}..tasks`)
    assert.equal(
      instances(locator, endpoint),
      `app-copy.${namespace}.${component}.${endpoint}..instances`
    )
    assert.equal(outbound(CHANNEL), `app-copy.${OUTBOUND}`)
    assert.equal(inbound(CHANNEL), `app-copy.${INBOUND}`)
    assert.equal(bound(CHANNEL, 'store.orders'), `app-copy.${queue('store.orders')}`)
    assert.equal(scoped('a.b.created'), 'app-copy.a.b.created')
  })
})

it('should leave a name as it is without a suffix', () => {
  assert.equal(scoped('a.b.created'), 'a.b.created')
})
