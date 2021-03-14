'use strict'

const { default: Ajv } = require('ajv')
const formats = require('ajv-formats')

let ajv

beforeEach(() => {
  ajv = new Ajv({ useDefaults: true })
  formats(ajv)

  const schema = {
    $id: 'schema://test',
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        format: 'email',
        default: 'foo'
      },
      bar: {
        type: 'integer'
      }
    }
  }

  const dependant = {
    $id: 'schema://dependant',
    type: 'object',
    properties: {
      foo: {
        $ref: 'schema://test#/properties/foo'
      },
      bar: {
        $ref: 'schema://test#/properties/bar',
        minimum: 10
      }
    }
  }

  ajv.addSchema(schema)
  ajv.addSchema(dependant)
})

it('test single property', () => {
  const validate = ajv.getSchema('schema://dependant')

  const v = { foo: 'asd@asd.com', bar: 11 }

  const valid = validate(v)

  if (!valid) console.log(validate.errors)

  console.log(v)
  expect(valid).toBe(true)
})
