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
    const options = { sort: [['a', 'asc'], ['b', 'desc'], ['id', 'asc']] }
    const query = translate({ options })

    assert.deepStrictEqual(query.options.sort, [['a', 1], ['b', -1], ['_id', 1]])
  })

  it('should translate projection', () => {
    const options = { projection: ['a', 'b', 'c', 'id'] }
    const query = translate({ options })

    assert.deepStrictEqual(query.options.projection, { a: 1, b: 1, c: 1, _id: 1 })
  })
})
