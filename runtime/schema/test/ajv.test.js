'use strict'

// schemas playground

const { default: Ajv } = require('ajv')
const ajv = new Ajv({ useDefaults: true, strictTypes: false })

const schema1 = {
  $id: 'operation:///foo',
  properties: {
    foo: {
      type: 'string'
    }
  }
}

const schema2 = {
  $id: 'operation:///bar',
  properties: {
    bar: {
      $ref: 'operation:///foo#/properties/foo'
    }
  }
}

ajv.addSchema(schema1)
ajv.addSchema(schema2)

it('should validate', () => {
  const validate = ajv.getSchema(schema2.$id)

  const result = validate({ bar: 'ok' })

  expect(result).toBeTruthy()
})
