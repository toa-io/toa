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
      subject: 'entries',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.http']
    },
    add: {
      type: 'transition',
      subject: 'entry',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.http', '@toa.io/bindings.amqp']
    }
  },
  events: {
    created: {
      bridge: 'whatever',
      path: '/somewhere',
      conditioned: true,
      subjective: false,
      binding: '@toa.io/bindings.amqp'
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
