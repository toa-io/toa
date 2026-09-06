export const ok = {
  namespace: 'foo',
  name: 'bar',
  entity: {
    storage: 'whatever',
    associated: false,
    custom: false,
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 128
      }
    }
  },
  operations: {
    get: {
      type: 'observation',
      scope: 'objects',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.amqp']
    },
    add: {
      type: 'transition',
      concurrency: 'none',
      scope: 'object',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.amqp']
    },
    set: {
      type: 'assignment',
      scope: 'changeset',
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.amqp']
    },
    compute: {
      type: 'computation',
      scope: 'none',
      query: false,
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.amqp']
    },
    affect: {
      type: 'effect',
      scope: 'none',
      query: false,
      bridge: 'whatever',
      bindings: ['@toa.io/bindings.amqp']
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
      operation: 'add',
      bridge: 'whatever',
      binding: 'amqp',
      path: '/somewhere',
      conditioned: false,
      adaptive: false
    }
  }
}
