'use strict'

const { join } = require('node:path')
const { generate } = require('randomstring')
const schemas = require('../')

it('should be', async () => {
  expect(schemas.namespace).toBeDefined()
})

it('should expand COS', async () => {
  const cos = {
    $id: 'foo',
    bar: 'string',
    baz: 'number'
  }

  const namespace = schemas.namespace([cos])
  const schema = namespace.schema(cos.$id)

  expect(schema.fit({ baz: 5 })).toStrictEqual(null)
})

it('should resolve references', async () => {
  const foo = {
    $id: generate(),
    foo: 'string'
  }

  const bar = {
    $id: generate(),
    bar: { $ref: foo.$id },
    baz: { $ref: foo.$id + '#/properties/foo' }
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
  it('should load schemas from directory', async () => {
    const path = join(__dirname, 'schemas')
    const namespace = schemas.namespace(path)

    const number = namespace.schema('number')

    expect(number).toBeDefined()
    expect(number.fit({ foo: 5 })).toStrictEqual(null)
    expect(number.fit({ foo: 'not a number' })).toMatchObject({ keyword: 'type' })

    const string = namespace.schema('string')

    expect(string).toBeDefined()
    expect(string.fit({ bar: 'a string' })).toStrictEqual(null)
    expect(string.fit({ bar: [1, 2] })).toMatchObject({ keyword: 'type' })

    const no = namespace.schema('not.a.schema')

    expect(no).toStrictEqual(undefined)
  })
})
