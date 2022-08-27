'use strict'

const { Range } = require('../src/query/range')

let range

const operation = { type: 'observation', scope: 'objects' }

describe('exact', () => {
  beforeAll(() => {
    range = new Range({ value: 10, range: [] })
  })

  it('should throw on value mismatch', () => {
    expect(() => range.parse(10, operation)).not.toThrow()
    expect(() => range.parse(11, operation)).toThrow(/out of range/)
  })
})
