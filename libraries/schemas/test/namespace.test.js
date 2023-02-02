'use strict'

const { join } = require('node:path')
const { generate } = require('randomstring')
const schemas = require('../')

it('should be', async () => {
  expect(schemas.namespace).toBeDefined()
})

it('should expand COS', async () => {
  const cos = {
    $id: 'foo', bar: 'string', baz: 'number'
  }

  const namespace = schemas.namespace([cos])
  const schema = namespace.schema(cos.$id)

  expect(schema.fit({ baz: 5 })).toStrictEqual(null)
})

it('should resolve references', async () => {
  const foo = {
    $id: generate(), foo: 'string'
  }

  const bar = {
    $id: generate(), bar: { $ref: foo.$id }, baz: { $ref: foo.$id + '#/properties/foo' }
  }

  const namespace = schemas.namespace([foo, bar])
  const schema = namespace.schema(bar.$id)

  expect(schema.fit({ bar: { foo: 'ok' }, baz: 'ok' })).toStrictEqual(null)

  expect(schema.fit({ bar: { foo: [1, 2] } }))
    .toMatchObject({ keyword: 'type', path: '/bar/foo' })

  expect(schema.fit({ bar: [1, 2] }))
    .toMatchObject({ keyword: 'type', path: '/bar' })

  expect(schema.fit({ baz: { not: 'ok' } }))
    .toMatchObject({ keyword: 'type', path: '/baz' })
})

describe('directory', () => {
  /** @type {toa.schemas.Namespace} */
  let namespace

  beforeAll(() => {
    const path = join(__dirname, 'schemas')

    namespace = schemas.namespace(path)
  })

  it('should load schemas from directory', async () => {
    const one = namespace.schema('one')

    expect(one).toBeDefined()
    expect(one.fit({ foo: 5 })).toStrictEqual(null)
    expect(one.fit({ foo: 'not a number' })).toMatchObject({ keyword: 'type' })

    const two = namespace.schema('two')

    expect(two).toBeDefined()
    expect(two.fit({ bar: 'a string' })).toStrictEqual(null)
    expect(two.fit({ bar: [1, 2] })).toMatchObject({ keyword: 'type' })

    const no = namespace.schema('not.a.schema')

    expect(no).toStrictEqual(undefined)
  })

  it('should resolve reference', async () => {
    const schema = namespace.schema('two')

    expect(schema.fit({ foo: 5 })).toStrictEqual(null)
    expect(schema.fit({ foo: [1, 2] })).toMatchObject({ keyword: 'type' })
  })

  it('should load schemas in nested directories', async () => {
    const schema = namespace.schema('nested/and.three')

    expect(schema).toBeDefined()
    expect(schema.fit({ qux: [3, 2, 1] })).toStrictEqual(null)
  })

  it('should resolve references to nested schemas', async () => {
    const schema = namespace.schema('two')

    expect(schema.fit({ baz: [1, 2] })).toStrictEqual(null)
  })
})
