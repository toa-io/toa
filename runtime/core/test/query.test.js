'use strict'

const { Query } = require('../src/query')
const fixtures = require('./query.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('criteria', () => {
  it('should not throw if no criteria', () => {
    const instance = new Query(fixtures.samples.simple.properties)
    const query = instance.parse({})

    expect(query.criteria).toBeUndefined()
  })

  it('should parse criteria', () => {
    const instance = new Query(fixtures.samples.simple.properties)
    const query = instance.parse(fixtures.samples.simple.query)

    expect(query.criteria).toEqual(fixtures.samples.simple.parsed.criteria)
  })

  it('should parse criteria with type coercion', () => {
    const instance = new Query(fixtures.samples.extended.properties)
    const query = instance.parse(fixtures.samples.extended.query)

    expect(query.criteria).toEqual(fixtures.samples.extended.parsed.criteria)
  })

  it('should throw on unknown properties', () => {
    const instance = new Query(fixtures.samples.simple.properties)

    expect(() => instance.parse({ criteria: 'lastname==Johnson' })).toThrow(/not defined/)
  })

  it('should parse id', () => {
    const instance = new Query()
    const query = instance.parse({ ...fixtures.samples.id.query })

    expect(query).toStrictEqual(fixtures.samples.id.parsed)
  })
})

describe('options', () => {
  const instance = new Query(fixtures.samples.abc.properties)

  it('should not throw if no options', () => {
    const query = instance.parse({})

    expect(query.options).toBeUndefined()
  })

  describe('omit, limit', () => {
    it('should pass', () => {
      const input = { omit: 1, limit: 1 }
      const query = instance.parse(input)

      expect(query.options).toStrictEqual(input)
    })
  })

  describe('sort', () => {
    it('should throw on format error', () => {
      const sorts = ['a,', ',a', 'a:asc,', 'a!:asc', 'a:any', 'a=desc', 'a:asc;b:desc']

      for (const sort of sorts) { expect(() => instance.parse({ sort })).toThrow(/sort parse error/) }
    })

    it('should return an array', () => {
      const sort = 'a:asc,b:desc'
      const query = instance.parse({ sort })

      expect(query.options.sort).toStrictEqual([['a', 'asc'], ['b', 'desc']])
    })

    it('should set default values', () => {
      const sort = 'a,b:desc,c'
      const query = instance.parse({ sort })

      expect(query.options.sort).toStrictEqual([['a', 'asc'], ['b', 'desc'], ['c', 'asc']])
    })

    it('should throw on unknown properties', () => {
      const sort = 'd:asc'

      expect(() => instance.parse({ sort })).toThrow(/not allowed/)
    })
  })

  describe('projection', () => {
    it('should throw on format error', () => {
      const projections = ['a,', ',a', 'a,b!,c', 'a,5']

      for (const projection of projections) { expect(() => instance.parse({ projection })).toThrow(/projection parse error/) }
    })

    it('should return an array', () => {
      const projection = 'a,b,c'
      const query = instance.parse({ projection })

      expect(query.options.projection).toStrictEqual(['a', 'b', 'c'])
    })

    it('should throw on unknown properties', () => {
      const projection = 'a,b,c,d'

      expect(() => instance.parse({ projection })).toThrow(/not allowed/)
    })
  })
})
