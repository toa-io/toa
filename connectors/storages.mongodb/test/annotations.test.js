'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./annotations.fixtures')
const { annotations } = require('../')

let declaration

beforeEach(() => {
  declaration = clone(fixtures.annotations)
})

it('should must be a function', () => {
  expect(annotations).toBeDefined()
  expect(annotations).toBeInstanceOf(Function)
})

describe('normalize', () => {
  it('should treat string value as default', () => {
    const declaration = 'mongodb://' + generate()
    const result = annotations(declaration)

    expect(result).toStrictEqual({ default: declaration })
  })

  it('should add schema to default', () => {
    const declaration = generate()
    const result = annotations(declaration)

    expect(result.default).toStrictEqual('mongodb://' + declaration)
  })

  it('should add schema to values', () => {
    const host = generate()

    declaration.credits.operations = host

    const result = /** @type {Object} */ annotations(declaration)

    expect(result.credits.operations).toStrictEqual('mongodb://' + host)
  })

  it('should split dot notation', () => {
    const url = 'mongodb://' + generate()

    declaration['foo.bar'] = url

    annotations(declaration)

    expect(declaration.foo?.bar).toStrictEqual(url)
  })

  it('should not overwrite with dot notation', () => {
    const url = 'mongodb://' + generate()

    declaration.foo = { bar: url }
    declaration['foo.baz'] = url

    annotations(declaration)

    expect(declaration.foo).toStrictEqual({ bar: url, baz: url })
  })
})

describe('validate', () => {
  it('should throw if declaration is not a string or an object', () => {
    // noinspection JSCheckFunctionSignatures
    expect(() => annotations(1)).toThrow(TypeError)
    expect(() => annotations(null)).toThrow(TypeError)
  })

  it('should throw if property is not string', () => {
    declaration.foo = 1

    expect(() => annotations(declaration)).toThrow(TypeError)
  })

  it('should throw if wrong schema', () => {
    declaration.foo = { bar: 'https://toa.io' }

    expect(() => annotations(declaration)).toThrow(TypeError)
  })
})
