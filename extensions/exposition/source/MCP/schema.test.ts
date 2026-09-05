import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { annotations, input, output } from './schema.js'
import type { Introspection, Schema } from '../Introspection.js'

const schema = (value: object): Schema => value as unknown as Schema

describe('input', () => {
  it('should ask for a route variable by the name the template gives it', () => {
    assert.deepEqual(input({ route: { id: schema({ type: 'string' }) } }, ['id']), {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false
    })
  })

  it('should ask for a variable the operation does not declare', () => {
    assert.deepEqual(input({}, ['id']), {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false
    })
  })

  it('should carry the querystring under a name of its own', () => {
    const introspection: Introspection = { query: { limit: schema({ type: 'integer' }) } }
    const { properties } = input(introspection, []) as { properties: Record<string, any> }

    assert.equal(properties.query.type, 'object')
    assert.deepEqual(properties.query.properties, { limit: { type: 'integer' } })
  })

  it('should leave a header where a call has nowhere to put one', () => {
    const introspection: Introspection = {
      headers: { token: { header: 'x-access-token', type: 'string' } }
    }

    assert.deepEqual(input(introspection, []),
      { type: 'object', properties: {}, additionalProperties: false })
  })

  it('should take the body as it is, requiring what it requires', () => {
    const introspection: Introspection = {
      input: schema({
        type: 'object',
        properties: { title: { type: 'string' }, volume: { type: 'number' } },
        required: ['title']
      })
    }

    assert.deepEqual(input(introspection, []), {
      type: 'object',
      properties: { title: { type: 'string' }, volume: { type: 'number' } },
      required: ['title'],
      additionalProperties: false
    })
  })
})

describe('output', () => {
  it('should state a schema the operation declared', () => {
    const declared = schema({ type: 'object', properties: { id: { type: 'string' } } })

    assert.deepEqual(output({ output: declared }), declared)
  })

  it('should state none where the operation declared none', () => {
    // an operation's `output` is optional and normalizes to `{}`, which describes nothing
    assert.equal(output({ output: schema({}) }), undefined)
    assert.equal(output({}), undefined)
  })
})

describe('annotations', () => {
  it('should read what the verb says of the call', () => {
    assert.deepEqual(annotations('GET'), { readOnlyHint: true })
    assert.deepEqual(annotations('HEAD'), { readOnlyHint: true })
    assert.deepEqual(annotations('DELETE'), { destructiveHint: true, idempotentHint: true })
    assert.deepEqual(annotations('PUT'), { idempotentHint: true })
    assert.equal(annotations('POST'), undefined)
  })
})
