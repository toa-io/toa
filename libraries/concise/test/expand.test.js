'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { expand } = require('../')

const valid = () => true

it('should be', () => {
  expect(expand).toBeDefined()
})

it('should throw on empty array property value', () => {
  const schema = { foo: [] }

  expect(() => expand(schema, valid)).toThrow('Array property declaration must be non-empty')
})

it('should throw if array property items are not of the same type', () => {
  const schema = { foo: [1, 'ok', []] }

  expect(() => expand(schema, valid)).toThrow('Array property items must be of the same type')
})

it('should not expand valid schema', () => {
  const schema = { type: 'number' }
  const output = expand(schema, valid)

  expect(output).toStrictEqual(schema)
})

it('should not expand $ref', async () => {
  const schema = { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/id' }
  const output = expand(schema, valid)

  expect(output).toStrictEqual(schema)
})

it('should expand pattern property oom with empty schema', async () => {
  const schema = { '~+': null }
  const output = expand(schema, valid)

  expect(output).toStrictEqual({
    type: 'object',
    patternProperties: {
      '^.*$': {
        oneOf: [
          {},
          {
            type: 'array',
            items: {}
          }
        ]
      }
    },
    additionalProperties: false
  })
})

it('should not expand $id', async () => {
  const schema = { $id: generate(), foo: 'string' }

  const expected = {
    $id: schema.$id,
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      }
    },
    additionalProperties: false
  }

  const output = expand(schema, valid)

  expect(output).toStrictEqual(expected)
})

it('should not modify input', async () => {
  const origin = { $id: generate(), foo: 'string' }
  const schema = clone(origin)

  expand(schema, valid)

  expect(schema).toStrictEqual(origin)
})

it('should expand reference', async () => {
  const ref = '#ok'
  const cos = { foo: 'ref:' + ref }
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({ properties: { foo: { $ref: ref } } })
})

it('should not throw on numbers ', async () => {
  expect(() => expand({ foo: 1 }, valid)).not.toThrow()
})

it.each(['string', 'number', 'integer', 'boolean', 'object', 'array'])('should expand Map<%s>',
  async (type) => {
    const cos = { foo: `<${type}>` }
    const schema = expand(cos, valid)

    expect(schema).toMatchObject({
      properties: {
        foo: {
          type: 'object',
          patternProperties: {
            '^.+$': { type }
          }
        }
      }
    })
  })

const FORMATS = ['date', 'time', 'date-time', 'duration', 'uri', 'uri-reference', 'uri-template', 'url', 'email', 'hostname', 'ipv4', 'ipv6', 'regex', 'uuid', 'json-pointer', 'json-pointer-uri-fragment', 'relative-json-pointer', 'byte', 'int32', 'int64', 'float', 'double', 'password', 'binary']

it.each(FORMATS)('should expand %s formats', async (format) => {
  const cos = format
  const schema = expand(cos, valid)

  expect(schema).toMatchObject({
    type: 'string',
    format
  })
})
