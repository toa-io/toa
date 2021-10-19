'use strict'

// schemas playground

const { default: Ajv } = require('ajv/dist/2019')
const ajv = new Ajv({ useDefaults: true, strictTypes: false })

const schema = {
  $ref: 'https://json-schema.org/draft/2019-09/schema'
}

it('should validate', () => {
  const validate = ajv.compile(schema)

  const result = validate({ properties: { foo: 'bar' } })

  expect(result).toBe(false)
})
