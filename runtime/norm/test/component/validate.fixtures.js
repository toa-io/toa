'use strict'

const ok = {
  namespace: 'foo',
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
  operations: {
    get: {
      type: 'observation',
      scope: 'objects',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.http']
    },
    add: {
      type: 'transition',
      concurrency: 'none',
      scope: 'object',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.http', '@toa.io/bindings.amqp']
    },
    set: {
      type: 'assignment',
      scope: 'changeset',
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
      binding: 'amqp',
      path: '/somewhere'
    }
  }
}

exports.ok = ok
