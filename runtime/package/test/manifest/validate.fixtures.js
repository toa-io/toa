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
  operations: {
    get: {
      type: 'observation',
      subject: 'set',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.http']
    },
    add: {
      type: 'transition',
      concurrency: 'none',
      subject: 'entity',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.http', '@toa.io/bindings.amqp']
    },
    set: {
      type: 'assignment',
      subject: 'changeset',
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
