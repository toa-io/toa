'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./annotations.fixtures')
const { annotations } = require('../')

const gen = () => generate().toLowerCase()

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
    const declaration = gen()
    const result = annotations(declaration)

    expect(result).toStrictEqual({ default: declaration })
  })

  it('should split dot notation', () => {
    const url = gen()

    declaration['foo.bar'] = url

    annotations(declaration)

    expect(declaration.foo?.bar).toStrictEqual(url)
  })

  it('should not overwrite with dot notation', () => {
    const url = gen()

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

  it('should throw if property is not url', () => {
    declaration.foo = '[]'

    expect(() => annotations(declaration)).toThrow(TypeError)
  })

  it('should throw if wrong schema', () => {
    declaration.foo = { bar: 'https://toa.io' }

    expect(() => annotations(declaration)).toThrow(TypeError)
  })
})
