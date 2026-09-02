'use strict'

const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')

const { join } = require('node:path')
const { generate } = require('randomstring')
const schemas = require('../')

it('should be', async () => {
  assert.notStrictEqual(schemas.namespace, undefined)
})

it('should build a namespace', async () => {
  const declaration = {
    $id: 'foo',
    type: 'object',
    properties: { bar: { type: 'string' }, baz: { type: 'number' } }
  }

  const namespace = schemas.namespace([declaration])
  const schema = namespace.schema(declaration.$id)

  assert.deepStrictEqual(schema.fit({ baz: 5 }), null)
})

it('should resolve references', async () => {
  const foo = {
    $id: generate(),
    type: 'object',
    properties: { foo: { type: 'string' } }
  }

  const bar = {
    $id: generate(),
    type: 'object',
    properties: {
      bar: { $ref: foo.$id },
      baz: { $ref: foo.$id + '#/properties/foo' }
    }
  }

  const namespace = schemas.namespace([foo, bar])
  const schema = namespace.schema(bar.$id)

  assert.deepStrictEqual(schema.fit({ bar: { foo: 'ok' }, baz: 'ok' }), null)

  assert.partialDeepStrictEqual(schema.fit({ bar: { foo: [1, 2] } }), { keyword: 'type', path: '/bar/foo' })

  assert.partialDeepStrictEqual(schema.fit({ bar: [1, 2] }), { keyword: 'type', path: '/bar' })

  assert.partialDeepStrictEqual(schema.fit({ baz: { not: 'ok' } }), { keyword: 'type', path: '/baz' })
})

describe('directory', () => {
  let namespace

  before(() => {
    const path = join(__dirname, 'schemas')

    namespace = schemas.namespace(path)
  })

  it('should load schemas from directory', async () => {
    const one = namespace.schema('one')

    assert.notStrictEqual(one, undefined)
    assert.deepStrictEqual(one.fit({ foo: 5 }), null)
    assert.partialDeepStrictEqual(one.fit({ foo: 'not a number' }), { keyword: 'type' })

    const two = namespace.schema('two')

    assert.notStrictEqual(two, undefined)
    assert.deepStrictEqual(two.fit({ bar: 'a string' }), null)
    assert.partialDeepStrictEqual(two.fit({ bar: [1, 2] }), { keyword: 'type' })
  })

  it('should throw on unknown schema', async () => {
    assert.throws(() => namespace.schema('not.a.schema'))
  })

  it('should resolve reference', async () => {
    const schema = namespace.schema('two')

    assert.deepStrictEqual(schema.fit({ foo: 5 }), null)
    assert.partialDeepStrictEqual(schema.fit({ foo: [1, 2] }), { keyword: 'type' })
  })

  it('should load schemas in nested directories', async () => {
    const schema = namespace.schema('nested/and.three')

    assert.notStrictEqual(schema, undefined)
    assert.deepStrictEqual(schema.fit({ qux: [3, 2, 1] }), null)
  })

  it('should resolve references to nested schemas', async () => {
    const schema = namespace.schema('two')

    assert.deepStrictEqual(schema.fit({ baz: [1, 2] }), null)
  })

  it('should resolve circular references', async () => {
    const schema = namespace.schema('circular/a')

    const value = {
      foo: {
        b: {
          bar: {
            a: {
              foo: {
                value: 1
              }
            },
            value: 'hello'
          }
        },
        value: 1
      }
    }

    assert.deepStrictEqual(schema.fit(value), null)
  })
})
