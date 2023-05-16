'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const { manifest } = require('../')

it('should export', () => {
  expect(manifest).toBeInstanceOf(Function)
})

describe('validation', () => {
  it('should throw if not an object', () => {
    const call = () => manifest(generate())
    expect(call).toThrow(/must be object/)
  })

  it('should throw if not a valid schema', () => {
    const object = { type: generate() }
    const call = () => manifest(object)

    expect(call).toThrow(/one of the allowed values/)
  })

  it('should throw if schema is not an object type', () => {
    const schema = { type: 'number' }
    const call = () => manifest(schema)

    expect(call).toThrow(/equal to constant 'object'/)
  })
})

describe('normalization', () => {
  it('should expand concise', () => {
    const concise = {
      foo: generate(),
      bar: {
        baz: random()
      }
    }

    const declaration = manifest(concise)

    expect(declaration).toMatchObject({
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          default: concise.foo
        },
        bar: {
          type: 'object',
          properties: {
            baz: {
              type: 'number',
              default: concise.bar.baz
            }
          }
        }
      }
    })
  })

  it('should expand partially concise', () => {
    const concise = {
      foo: generate(),
      bar: {
        baz: random()
      },
      qux: {
        type: 'string',
        default: null
      }
    }

    const declaration = manifest(concise)

    expect(declaration).toMatchObject({
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          default: concise.foo
        },
        bar: {
          type: 'object',
          properties: {
            baz: {
              type: 'number',
              default: concise.bar.baz
            }
          }
        },
        qux: {
          type: 'string',
          default: null
        }
      }
    })
  })

  it('should expand arrays', () => {
    const concise = { foo: [1, 2, 3] }

    const declaration = manifest(concise)

    expect(declaration).toMatchObject({
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: {
            type: 'number'
          },
          default: [1, 2, 3]
        }
      }
    })
  })

  it('should throw on empty array', () => {
    const concise = { foo: [] }

    expect(() => manifest(concise)).toThrow(/array items type because it's empty/)
  })

  it('should throw on null', () => {
    const concise = { foo: null }

    expect(() => manifest(concise)).toThrow(/type of null/)
  })
})
