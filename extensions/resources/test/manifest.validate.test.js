'use strict'

const { validate } = require('../src/manifest/validate')

it('should validate', () => {
  const resources = {
    '/path/to': {
      operations: [
        {
          operation: 'foo',
          type: 'observation',
          subject: 'entry'
        }
      ],
      '/deeper/': {
        operations: [{
          operation: 'bar',
          type: 'transition',
          subject: 'entry'
        }]
      }
    }
  }

  expect(() => validate(resources)).not.toThrow()
})
