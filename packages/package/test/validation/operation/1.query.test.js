'use strict'

const path = require('path')

const { validation } = require('../../../src/validation/validation')
const fixtures = require('./1.query.fixtures')

const validate = validation(path.resolve(__dirname, '../../../src/validation/rules/operation'), '1.query.js')

describe('entity not defined', () => {
  it('should be ok if query is not defined', () => {
    const { operation, ok } = fixtures.sample('undefined')

    expect(() => validate(operation, {})).not.toThrow()
    expect(console.warn).toHaveBeenCalledTimes(0)

    expect(operation.query).toEqual(ok)
  })
})

describe('entity is defined', () => {
  it('should be ok if query is defined', () => {
    for (const sample of ['null', 'queryArray']) {
      const { operation } = fixtures.sample(sample)

      expect(() => validate(operation, fixtures.manifest)).not.toThrow()
    }
  })

  it('should expand array', () => {
    const { operation, ok } = fixtures.sample('queryArray')

    validate(operation, fixtures.manifest)

    expect(operation.query).toEqual(ok)
  })

  it('should expand string', () => {
    const { operation, ok } = fixtures.sample('queryString')

    validate(operation, fixtures.manifest)

    expect(operation.query).toEqual(ok)
  })

  describe('criteria', () => {
    it('should warn if not defined', () => {
      const { operation, ok } = fixtures.sample('criteria.undefined')

      expect(() => validate(operation, fixtures.manifest)).not.toThrow()

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('warn'),
        expect.stringContaining('query.criteria is not defined')
      )

      expect(operation.query).toEqual(ok)
    })

    it('should expand array', () => {
      const { operation, ok } = fixtures.sample('criteria.array')

      validate(operation, fixtures.manifest)

      expect(operation.query).toEqual(ok)
    })

    it('should expand string', () => {
      const { operation, ok } = fixtures.sample('criteria.string')

      validate(operation, fixtures.manifest)

      expect(operation.query).toEqual(ok)
    })
  })
})
