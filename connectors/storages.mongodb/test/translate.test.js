import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { translate } from '../src/translate.js'

describe('options', () => {
  it('should translate omit', () => {
    const options = { omit: 10 }
    const query = translate({ options })

    assert.deepStrictEqual(query.options.skip, options.omit)
  })

  it('should translate limit', () => {
    const options = { limit: 10 }
    const query = translate({ options })

    assert.deepStrictEqual(query.options.limit, options.limit)
  })

  it('should translate sort', () => {
    const options = {
      sort: [
        ['a', 'asc'],
        ['b', 'desc'],
        ['id', 'asc']
      ]
    }
    const query = translate({ options })

    assert.deepStrictEqual(query.options.sort, [
      ['a', 1],
      ['b', -1],
      ['_id', 1]
    ])
  })

  it('should translate projection', () => {
    const options = { projection: ['a', 'b', 'c', 'id'] }
    const query = translate({ options })

    assert.deepStrictEqual(query.options.projection, { a: 1, b: 1, c: 1, _id: 1 })
  })
})

describe('dates', () => {
  const comparison = (selector, operator, value) => ({
    type: 'COMPARISON',
    operator,
    left: { type: 'SELECTOR', selector },
    right: { type: 'VALUE', value }
  })

  it('should compare a date property against a date', () => {
    const criteria = comparison('settled', '<', '2026-09-05T10:00:00.000Z')
    const query = translate({ criteria }, ['settled'])

    assert.ok(query.criteria.settled.$lt instanceof Date)
    assert.strictEqual(
      query.criteria.settled.$lt.toISOString(),
      '2026-09-05T10:00:00.000Z'
    )
  })

  it('should convert every value of a list', () => {
    const criteria = comparison('settled', '=in=', ['2026-09-05T10:00:00.000Z'])
    const query = translate({ criteria }, ['settled'])

    assert.ok(query.criteria.settled.$in[0] instanceof Date)
  })

  it('should leave a property that is not a date', () => {
    const criteria = comparison('endpoint', '==', 'a.b.c')
    const query = translate({ criteria }, ['settled'])

    assert.deepStrictEqual(query.criteria, { endpoint: { $eq: 'a.b.c' } })
  })

  it('should leave every criterion where the entity declares no date', () => {
    const criteria = comparison('settled', '<', '2026-09-05T10:00:00.000Z')
    const query = translate({ criteria })

    assert.strictEqual(query.criteria.settled.$lt, '2026-09-05T10:00:00.000Z')
  })
})
