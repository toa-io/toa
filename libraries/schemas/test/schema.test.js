'use strict'

const { generate } = require('randomstring')

const schemas = require('../')

it('should be', async () => {
  expect(schemas.schema).toBeDefined()
})

it('should expose schema id', async () => {
  const $id = generate()
  const schema = schemas.schema({ $id })

  expect(schema.id).toStrictEqual($id)
})

describe('fit', () => {
  it('should fit', () => {
    const schema = schemas.schema('integer')
    const error = schema.fit(5)

    expect(error).toStrictEqual(null)
  })

  it('should return error', async () => {
    const schema = schemas.schema('integer')
    const error = schema.fit({ not: 'ok' })

    expect(error).not.toStrictEqual(null)
    expect(error.message).toStrictEqual('must be integer')
  })

  it('should set defaults', () => {
    const def = generate()
    const schema = schemas.schema({ foo: def })
    const value = {}

    schema.fit(value)

    expect(value.foo).toStrictEqual(def)
  })

  it('should coerce types', async () => {
    const schema = schemas.schema({ foo: 'string' })
    const value = { foo: 1 }

    schema.fit(value)

    expect(value.foo).toStrictEqual('1')
  })
})
