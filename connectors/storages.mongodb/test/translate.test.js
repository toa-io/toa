'use strict'

const { translate } = require('../src/translate')

describe('options', () => {
  it('should translate omit', () => {
    const options = { omit: 10 }
    const query = translate({ options })

    expect(query.options.skip).toStrictEqual(options.omit)
  })

  it('should translate limit', () => {
    const options = { limit: 10 }
    const query = translate({ options })

    expect(query.options.limit).toStrictEqual(options.limit)
  })

  it('should translate sort', () => {
    const options = { sort: [['a', 'asc'], ['b', 'desc'], ['id', 'asc']] }
    const query = translate({ options })

    expect(query.options.sort).toStrictEqual([['a', 1], ['b', -1], ['_id', 1]])
  })

  it('should translate projection', () => {
    const options = { projection: ['a', 'b', 'c', 'id'] }
    const query = translate({ options })

    expect(query.options.projection).toStrictEqual({ a: 1, b: 1, c: 1, _id: 1 })
  })
})
