'use strict'

const { default: Ajv } = require('ajv')

let ajv

beforeEach(() => {
  ajv = new Ajv({ useDefaults: true })

  const schema = {
    $id: 'schema://error',
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      },
      bar: {
        type: 'string'
      }
    }
  }

  ajv.addSchema(schema, 'error')
})

it('test single property', () => {
  const key = ajv.getSchema('error')
  const uri = ajv.getSchema('schema://error')

  console.log(key.schema)
  console.log(uri.schema)
})
