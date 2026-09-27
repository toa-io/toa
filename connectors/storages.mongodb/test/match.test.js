import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { match } from '../src/match.js'

const record = {
  _id: 'a1',
  owner: 'alice',
  rank: 5,
  tags: ['red', 'green'],
  DELETED: null,
  CREATED: new Date(1000)
}

describe('match', () => {
  it('should match a bare value as equality', () => {
    assert.equal(match(record, { owner: 'alice' }), true)
    assert.equal(match(record, { owner: 'bob' }), false)
  })

  it('should match null against a field that is null or not there', () => {
    assert.equal(match(record, { DELETED: null }), true)
    assert.equal(match(record, { missing: null }), true)
    assert.equal(match({ ...record, DELETED: new Date(1) }, { DELETED: null }), false)
  })

  it('should compare values of one type', () => {
    assert.equal(match(record, { rank: { $gt: 4 } }), true)
    assert.equal(match(record, { rank: { $gte: 5, $lt: 6 } }), true)
    assert.equal(match(record, { rank: { $lte: 4 } }), false)
    assert.equal(match(record, { owner: { $gt: 'a' } }), true)
  })

  it('should compare values of two types as neither greater nor less', () => {
    assert.equal(match(record, { rank: { $gt: '1' } }), false)
    assert.equal(match(record, { rank: { $lt: '9' } }), false)
  })

  it('should compare dates by their instant', () => {
    assert.equal(match(record, { CREATED: new Date(1000) }), true)
    assert.equal(match(record, { CREATED: { $gt: new Date(999) } }), true)
    assert.equal(match(record, { CREATED: { $eq: new Date(1001) } }), false)
  })

  it('should match a list of values', () => {
    assert.equal(match(record, { owner: { $in: ['bob', 'alice'] } }), true)
    assert.equal(match(record, { owner: { $nin: ['bob', 'alice'] } }), false)
    assert.equal(match(record, { owner: { $ne: 'bob' } }), true)
  })

  it('should match an array where one of its elements does', () => {
    assert.equal(match(record, { tags: 'red' }), true)
    assert.equal(match(record, { tags: { $in: ['blue', 'green'] } }), true)
    assert.equal(match(record, { tags: { $ne: 'red' } }), false)
  })

  it('should combine filters', () => {
    assert.equal(match(record, { $and: [{ owner: 'alice' }, { rank: { $gt: 1 } }] }), true)
    assert.equal(match(record, { $or: [{ owner: 'bob' }, { rank: { $gt: 1 } }] }), true)
    assert.equal(match(record, { $or: [{ owner: 'bob' }, { rank: { $gt: 9 } }] }), false)
    assert.equal(match(record, { owner: 'alice', DELETED: null, _id: 'a1' }), true)
  })

  it('should refuse a search', () => {
    assert.throws(() => match(record, { $text: { $search: 'x' } }))
  })
})
