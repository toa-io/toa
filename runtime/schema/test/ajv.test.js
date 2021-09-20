'use strict'

// schemas playground

const { default: Ajv } = require('ajv/dist/2019')
const ajv = new Ajv({ useDefaults: true, strictTypes: false })

const schema = {
  properties: {
    foo: {
      type: 'string'
    },
    bar: {
      type: 'string'
    }
  },
  dependentSchemas: {
    foo: {
      properties: {
        bar: false
      }
    },
    bar: {
      properties: {
        foo: false
      }
    }
  }
}

it('should validate', () => {
  const validate = ajv.compile(schema)

  const result = validate({ bar: 'ok' })

  expect(result).toBeTruthy()
})
