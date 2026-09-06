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

  it('should coerce types', async () => {
    const schema = schemas.schema({
      type: 'object',
      properties: { foo: { type: 'string' } }
    })

    const value = { foo: 1 }

    schema.fit(value)

    assert.deepStrictEqual(value.foo, '1')
  })

  it('should not write a default', () => {
    const schema = schemas.schema({
      type: 'object',
      properties: { foo: { type: 'string', default: generate() } }
    })

    const value = {}

    assert.deepStrictEqual(schema.fit(value), null)
    assert.deepStrictEqual(value, {})
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
