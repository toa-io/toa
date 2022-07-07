'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./hostmap.fixtures')
const { hostmap } = require('../')

const gen = () => 'schema://host-' + generate().toLowerCase()

let annotations

beforeEach(() => {
  annotations = clone(fixtures.annotations)
})

it('should must be a function', () => {
  expect(hostmap).toBeDefined()
  expect(hostmap).toBeInstanceOf(Function)
})

describe('normalize', () => {
  it('should treat string value as default', () => {
    const declaration = gen()
    const result = hostmap(declaration)

    expect(result).toStrictEqual({ default: declaration })
  })

  it('should split dot notation', () => {
    const url = gen()

    annotations['foo.bar'] = url

    hostmap(annotations)

    expect(annotations.foo?.bar).toStrictEqual(url)
  })

  it('should not overwrite with dot notation', () => {
    const url = gen()

    annotations.foo = { bar: url }
    annotations['foo.baz'] = url

    hostmap(annotations)

    expect(annotations.foo).toStrictEqual({ bar: url, baz: url })
  })
})

describe('validate', () => {
  it('should throw if declaration is not a string or an object', () => {
    // noinspection JSCheckFunctionSignatures
    expect(() => hostmap(1)).toThrow(TypeError)
    expect(() => hostmap(null)).toThrow(TypeError)
  })

  it('should throw if property is not url', () => {
    annotations.foo = '[]'

    expect(() => hostmap(annotations)).toThrow(TypeError)
  })
})
