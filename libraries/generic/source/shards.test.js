import { it } from 'node:test'
import assert from 'node:assert/strict'

import { shards } from '../source/index.js'

it('should be', async () => {
  assert.ok(shards instanceof Function)
})

it('should expand a range into a URL per number, its end exclusive', async () => {
  assert.deepStrictEqual(shards('amqp://host[0..3].domain.com:5672/vhost?test=1'), [
    'amqp://host0.domain.com:5672/vhost?test=1',
    'amqp://host1.domain.com:5672/vhost?test=1',
    'amqp://host2.domain.com:5672/vhost?test=1'
  ])
})

it('should pad every number to the width of a start with leading zeros', async () => {
  assert.deepStrictEqual(shards('amqp://rmq[08..11].example.com'), [
    'amqp://rmq08.example.com',
    'amqp://rmq09.example.com',
    'amqp://rmq10.example.com'
  ])
})

it('should expand every range of a host', async () => {
  assert.deepStrictEqual(shards('redis://r[0..2]-[1..3].example.com'), [
    'redis://r0-1.example.com',
    'redis://r0-2.example.com',
    'redis://r1-1.example.com',
    'redis://r1-2.example.com'
  ])
})

it('should look at the host alone', async () => {
  const urls = [
    'amqp://user:[0..2]@host.example.com',
    'amqp://host.example.com/[0..2]?range=[0..2]',
    'amqp://[::1]:5672',
    'amqp://host.example.com',
    'not a url [0..2]'
  ]

  for (const url of urls) assert.deepStrictEqual(shards(url), [url])
})

it('should refuse a range that names no hosts', async () => {
  assert.throws(() => shards('amqp://rmq[3..3].example.com'), RangeError)
  assert.throws(() => shards('amqp://rmq[3..1].example.com'), RangeError)
})
