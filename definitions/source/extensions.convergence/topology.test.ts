import { it } from 'node:test'
import assert from 'node:assert/strict'

import { commands, topology, vhost, INBOUND, OUTBOUND } from './topology.ts'

const labels = ['store.orders', 'identity.roles']

const find = (objects: object[], name: string): any =>
  objects.find((one) => (one as { name: string }).name === name)

it('should declare both exchanges, direct and durable', () => {
  const { exchanges } = topology(labels)

  assert.equal(exchanges.length, 2)

  for (const name of [INBOUND, OUTBOUND])
    assert.deepEqual(find(exchanges, name), {
      name,
      vhost: '/',
      type: 'direct',
      durable: true,
      auto_delete: false,
      internal: false,
      arguments: {}
    })
})

it('should declare a durable queue per component, with no arguments of its own', () => {
  const { queues } = topology(labels)

  assert.deepEqual(
    queues.map((one) => (one as { name: string }).name),
    ['convergence.store.orders', 'convergence.identity.roles']
  )

  assert.deepEqual(find(queues, 'convergence.store.orders'), {
    name: 'convergence.store.orders',
    vhost: '/',
    durable: true,
    auto_delete: false,
    arguments: {}
  })
})

it('should bind each queue to the inbound exchange under the component', () => {
  const { bindings } = topology(labels)

  assert.deepEqual(bindings[0], {
    source: INBOUND,
    vhost: '/',
    destination: 'convergence.store.orders',
    destination_type: 'queue',
    routing_key: 'store.orders',
    arguments: {}
  })
})

it('should declare the exchanges where nothing converges', () => {
  const { exchanges, queues, bindings } = topology([])

  assert.equal(exchanges.length, 2)
  assert.equal(queues.length, 0)
  assert.equal(bindings.length, 0)
})

it('should carry the vhost into everything it declares', () => {
  const { exchanges, queues, bindings } = topology(labels, 'records')

  for (const one of [...exchanges, ...queues, ...bindings])
    assert.equal((one as { vhost: string }).vhost, 'records')
})

it('should read the vhost of the brokers a region declares', () => {
  assert.equal(vhost('amqp://rmq'), '/')
  assert.equal(vhost('amqp://rmq/records'), 'records')
  assert.equal(vhost(['amqp://rmq-0/records', 'amqp://rmq-1/records']), 'records')

  // a path of one slash is the empty vhost, which is what an AMQP URI means by it
  assert.equal(vhost('amqp://rmq/'), '')
})

it('should say the same thing as commands', () => {
  const lines = commands(labels)

  assert.equal(lines.length, 6)
  assert.match(lines[0], /declare exchange name=convergence.in type=direct durable=true/)
  assert.match(lines[2], /declare queue name=convergence.store.orders durable=true/)
  assert.match(lines[3], /destination=convergence.store.orders routing_key=store.orders/)

  for (const line of lines) assert.doesNotMatch(line, /--vhost/)
})

it('should name the vhost in a command only where it is not the default', () => {
  for (const line of commands(labels, 'records')) assert.match(line, /--vhost=records/)
})
