import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const comq = { assert: mock.fn() }

mock.module('comq', { namedExports: comq })

/** @type {comq.IO} */
let io

/** @type {typeof import('../source/factory.js').Factory} */
let Factory

let factory

const uris = ['amqp://cnv-0', 'amqp://cnv-1']

beforeEach(async () => {
  io = {
    diagnose: mock.fn(),
    seal: mock.fn(),
    close: mock.fn(),
    route: mock.fn(),
    subscribe: mock.fn()
  }

  comq.assert.mock.mockImplementation(async () => io)

  // the history and not the mock: `mock.reset()` would take the module mock with it, and
  // the connector would reach for a broker that is not there
  comq.assert.mock.resetCalls()

  // a module is evaluated once per specifier, and the connector diagnoses a broker set once
  // per process, so each scenario asks for a distinct one
  ;({ Factory } = await import('../source/factory.js?' + Math.random()))

  factory = new Factory()
})

it('should carry a channel over every broker it is given', async () => {
  const outbound = factory.outbound('convergence', uris)

  await outbound.connect()

  // comq shards a connection over the brokers it is asserted with, and a region may name
  // several: handing over one of them would leave the rest unpublished to and unread
  assert.deepEqual(comq.assert.mock.calls[0].arguments, uris)
})

it('should consume a channel over every broker it is given', async () => {
  const inbound = factory.inbound('convergence', uris, 'store.orders', { accept: mock.fn() })

  await inbound.connect()

  assert.deepEqual(comq.assert.mock.calls[0].arguments, uris)
})

it('should not have one label seal the consumption of another', async () => {
  const one = factory.inbound('convergence', uris, 'store.orders', { accept: mock.fn() })
  const another = factory.inbound('convergence', uris, 'store.customers', {
    accept: mock.fn()
  })

  await one.connect()
  await another.connect()

  // sealing stops every consumer of a communication at once, and what consumes for one
  // component must stop when that component does and not before
  assert.equal(comq.assert.mock.callCount(), 2)
})
