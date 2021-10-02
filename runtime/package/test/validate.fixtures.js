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
  remotes: ['one.foo', 'two.bar'],
  operations: {
    get: {
      type: 'observation',
      target: 'entries',
      bridge: 'whatever',
      bindings: ['@kookaburra/bindings.http']
    },
    add: {
      type: 'transition',
      target: 'entry',
      bridge: 'whatever',
      bindings: ['@kookaburra/bindings.http', '@kookaburra/bindings.amqp']
    }
  },
  events: {
    created: {
      bridge: 'whatever',
      path: '/somewhere',
      conditioned: true,
      subjective: false,
      binding: '@kookaburra/bindings.amqp'
    }
  },
  receivers: {
    'foo.bar.happened': {
      transition: 'add',
      bridge: 'whatever',
      path: '/somewhere'
    }
  }
}

exports.ok = ok
