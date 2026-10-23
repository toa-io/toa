import { it } from 'node:test'
import assert from 'node:assert/strict'

import { consumer, id, literal, retention } from './ddl.ts'

const names = { exchange: 'chronicles.out', queue: 'chronicles', dead: 'chronicles.dead' }

it('should leave a retention that agrees with the table', () => {
  const engine =
    'ReplacingMergeTree PARTITION BY toYYYYMM(time) ORDER BY (label, toDate(time), id) TTL toDateTime(time) + toIntervalDay(730) SETTINGS index_granularity = 8192'

  assert.deepEqual(retention(730, engine), [])
})

it('should change a retention that differs', () => {
  const engine =
    'ReplacingMergeTree TTL toDateTime(time) + toIntervalDay(30) SETTINGS a = 1'

  assert.deepEqual(retention(730, engine), [
    'ALTER TABLE events MODIFY TTL toDateTime(time) + INTERVAL 730 DAY'
  ])
})

it('should add a retention to a table that keeps everything', () => {
  assert.equal(retention(7, 'ReplacingMergeTree ORDER BY id').length, 1)
})

it('should remove a retention no longer declared', () => {
  const engine =
    'ReplacingMergeTree TTL toDateTime(time) + toIntervalDay(30) SETTINGS a = 1'

  assert.deepEqual(retention(undefined, engine), ['ALTER TABLE events REMOVE TTL'])
  assert.deepEqual(retention(undefined, 'ReplacingMergeTree ORDER BY id'), [])
})

it('should tell one broker from another by the fingerprint of the consumer', () => {
  const one = consumer('shop', 'amqp://a:b@one:5672/', names)
  const same = consumer('shop', 'amqp://a:b@one:5672/', names)
  const other = consumer('shop', 'amqp://a:c@one:5672/', names)

  assert.equal(one.fingerprint, same.fingerprint)
  assert.notEqual(one.fingerprint, other.fingerprint)
})

it('should consume the queue the binding retains, and nothing it declares itself', () => {
  const [collection] = consumer('shop', 'amqp://one:5672/', names).create

  assert.match(collection, /rabbitmq_queue_consume = 1/)
  assert.match(collection, /rabbitmq_queue_base = 'chronicles'/)
  assert.match(collection, /rabbitmq_exchange_name = 'chronicles.out'/)
})

it('should refuse an identifier it would have to quote', () => {
  assert.throws(() => id('shop; DROP DATABASE x'))
  assert.equal(id('shop_1'), '`shop_1`')
})

it('should escape a literal', () => {
  assert.equal(literal("it's \\ fine"), "'it\\'s \\\\ fine'")
})
