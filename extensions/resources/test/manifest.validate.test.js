'use strict'

const { validate } = require('../src/.manifest')

it('should validate', () => {
  const resources = {
    '/path/to': {
      operations: [
        {
          operation: 'foo',
          type: 'observation'
        }
      ],
      '/deeper/': {
        operations: [{
          operation: 'bar',
          type: 'transition',
          query: false
        }]
      }
    }
  }

  expect(() => validate(resources)).not.toThrow()
})
