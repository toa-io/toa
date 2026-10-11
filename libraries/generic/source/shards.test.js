import { it } from 'node:test'
import assert from 'node:assert/strict'

import { shards } from '../source/index.js'

it('should be', async () => {
  assert.ok(shards instanceof Function)
})

it('should expand a range into a URL per number', async () => {
  assert.deepStrictEqual(shards('amqp://host[0..2].domain.com:5672/vhost?test=1'), [
    'amqp://host0.domain.com:5672/vhost?test=1',
    'amqp://host1.domain.com:5672/vhost?test=1',
    'amqp://host2.domain.com:5672/vhost?test=1'
  ])
})

it('should write every number as wide as the end of the range', async () => {
  const urls = shards('amqp://rmq[0..31].example.com')

  assert.equal(urls.length, 32)
  assert.equal(urls[0], 'amqp://rmq00.example.com')
  assert.equal(urls[9], 'amqp://rmq09.example.com')
  assert.equal(urls[31], 'amqp://rmq31.example.com')

  assert.deepStrictEqual(shards('amqp://rmq[8..010]'), [
    'amqp://rmq008',
    'amqp://rmq009',
    'amqp://rmq010'
  ])
})

it('should expand every range of a host', async () => {
  assert.deepStrictEqual(shards('redis://r[0..1]-[1..2].example.com'), [
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

it('should refuse a range that does not end above where it starts', async () => {
  assert.throws(() => shards('amqp://rmq[3..3].example.com'), RangeError)
  assert.throws(() => shards('amqp://rmq[3..1].example.com'), RangeError)
})
