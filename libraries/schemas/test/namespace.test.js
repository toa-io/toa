'use strict'

const { generate } = require('randomstring')
const schemas = require('../')

it('should be', async () => {
  expect(schemas.namespace).toBeDefined()
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
