'use strict'

const ok = {
  domain: 'foo',
  name: 'bar',
  entity: {
    storage: {
      connector: 'whatever'
    },
    schema: {
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 128
        }
      }
    }
  },
  remotes: ['one', 'two'],
  operations: [
    {
      name: 'get',
      type: 'observation',
      target: 'set',
      bridge: 'whatever'
    },
    {
      name: 'add',
      type: 'transition',
      target: 'entry',
      bridge: 'whatever'
    }
  ]
}

exports.ok = ok
