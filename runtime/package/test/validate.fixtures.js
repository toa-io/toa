'use strict'

const ok = {
  domain: 'foo',
  name: 'bar',
  entity: {
    storage: 'whatever',
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
  bindings: ['@kookaburra/bindings.http', '@kookaburra/bindings.amqp'],
  remotes: ['one', 'two'],
  operations: [
    {
      name: 'get',
      type: 'observation',
      target: 'entries',
      bridge: 'whatever',
      bindings: ['@kookaburra/bindings.http']
    },
    {
      name: 'add',
      type: 'transition',
      target: 'entry',
      bridge: 'whatever'
    }
  ],
  events: [
    {
      label: 'created',
      bridge: 'whatever',
      path: '/somewhere',
      conditional: true,
      subjective: false
    }
  ]
}

exports.ok = ok
