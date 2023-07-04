'use strict'

const { form } = require('./form')

it('should be defined', () => {
  expect(form).toBeDefined()
})

it('should set default empty array for array', () => {
  const schema = {
    type: 'object',
    properties: {
      arr: {
        type: 'array',
        items: {
          type: 'string',
          definitions: {}
        },
        definitions: {}
      },
    }
  }

  const result = form(schema)
  expect(result.arr).toStrictEqual([])
})
