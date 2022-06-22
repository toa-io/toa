'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./proxy.fixtures')
const { proxy } = require('../')

const gen = () => generate().toLowerCase()

let declaration

beforeEach(() => {
  declaration = clone(fixtures.annotations)
})

it('should must be a function', () => {
  expect(proxy).toBeDefined()
  expect(proxy).toBeInstanceOf(Function)
})

describe('normalize', () => {
  it('should treat string value as default', () => {
    const declaration = gen()
    const result = proxy(declaration)

    expect(result).toStrictEqual({ default: declaration })
  })

  it('should split dot notation', () => {
    const url = gen()

    declaration['foo.bar'] = url

    proxy(declaration)

    expect(declaration.foo?.bar).toStrictEqual(url)
  })

  it('should not overwrite with dot notation', () => {
    const url = gen()

    declaration.foo = { bar: url }
    declaration['foo.baz'] = url

    proxy(declaration)

    expect(declaration.foo).toStrictEqual({ bar: url, baz: url })
  })
})

describe('validate', () => {
  it('should throw if declaration is not a string or an object', () => {
    // noinspection JSCheckFunctionSignatures
    expect(() => proxy(1)).toThrow(TypeError)
    expect(() => proxy(null)).toThrow(TypeError)
  })

  it('should throw if property is not url', () => {
    declaration.foo = '[]'

    expect(() => proxy(declaration)).toThrow(TypeError)
  })

  it('should throw if wrong schema', () => {
    declaration.foo = { bar: 'https://toa.io' }

    expect(() => proxy(declaration)).toThrow(TypeError)
  })
})
