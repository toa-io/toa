import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { join } from 'node:path'

import * as schemas from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(schemas.schema, undefined)
})

it('should expose schema id', async () => {
  const $id = generate()
  const schema = schemas.schema({ $id })

  assert.deepStrictEqual(schema.id, $id)
})

describe('fit', () => {
  it('should fit', () => {
    const schema = schemas.schema({ type: 'integer' })
    const error = schema.fit(5)

    assert.deepStrictEqual(error, null)
  })

  it('should return error', async () => {
    const schema = schemas.schema({ type: 'integer' })
    const error = schema.fit({ not: 'ok' })

    assert.notDeepStrictEqual(error, null)
    assert.ok(error.message.includes('must be integer'))
  })

  it('should set defaults', () => {
    const def = generate()
    const schema = schemas.schema({
      type: 'object',
      properties: { foo: { type: 'string', default: def } }
    })
    const value = {}

    schema.fit(value)

    assert.deepStrictEqual(value.foo, def)
  })

  it('should coerce types', async () => {
    const schema = schemas.schema({
      type: 'object',
      properties: { foo: { type: 'string' } }
    })

    const value = { foo: 1 }

    schema.fit(value)

    assert.deepStrictEqual(value.foo, '1')
  })

  it('should not delete arrays that belongs to Daria', () => {
    const schema = schemas.schema({
      type: 'object',
      properties: {
        arr: {
          type: 'array',
          items: {
            type: 'string'
          },
          default: ['foo']
        }
      }
    })

    const o = {}
    const error = schema.fit(o)

    assert.deepStrictEqual(error, null)
    assert.deepStrictEqual(o.arr, ['foo'])

    o.arr = ['bar']

    const error2 = schema.fit(o)

    assert.deepStrictEqual(error2, null)
    assert.deepStrictEqual(o.arr, ['bar'])
  })

})

describe('validate', () => {
  it('should throw Exception', async () => {
    
    const schema = schemas.schema({
      type: 'object',
      properties: { foo: { type: 'string' } }
    })

    const value = { foo: { not: 'ok' } }

    try {
      schema.validate(value)
    } catch (exception) {
      assert.ok(exception instanceof TypeError)
    }
  })

  it('should support formats', async () => {
    const schema = schemas.schema({
      properties: {
        foo: {
          type: 'string',
          format: 'uri'
        }
      }
    })

    const value = { foo: 'http://toa.io' }

    assert.doesNotThrow(() => schema.validate(value))
  })
})

describe('file', () => {
  it('should load schema from a file', async () => {
    const path = join(import.meta.dirname, 'schemas/one.cos.yaml')
    const schema = schemas.schema(path)

    assert.doesNotThrow(() => schema.validate({ foo: 5 }))
  })
})
