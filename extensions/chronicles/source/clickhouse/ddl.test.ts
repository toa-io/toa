import { it } from 'node:test'
import assert from 'node:assert/strict'

import { id, literal, retention } from './ddl.ts'

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

it('should refuse an identifier it would have to quote', () => {
  assert.throws(() => id('shop; DROP DATABASE x'))
  assert.equal(id('shop_1'), '`shop_1`')
})

it('should escape a literal', () => {
  assert.equal(literal("it's \\ fine"), "'it\\'s \\\\ fine'")
})
