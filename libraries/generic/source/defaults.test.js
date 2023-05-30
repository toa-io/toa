'use strict'

const { generate } = require('randomstring')
const { defaults } = require('../')

it('should be', async () => {
  expect(defaults).toBeInstanceOf(Function)
})

it('should return the default value from schema', () => {
  const id = generate()
  const schema = {
    properties: {
      id: {
        type: 'string',
        default: id,
        definitions: {}
      }
    },
    type: 'object'
  }

  const result = defaults(schema)
  expect(result).toStrictEqual({
    id
  })
})

it('should return empty object from schema without defaults', () => {
  const name = generate()
  const schema = {
    properties: {
      [name]: {
        type: 'number',
        definitions: {}
      }
    },
    type: 'object'
  }

  const result = defaults(schema)
  expect(result).toStrictEqual({})
})
