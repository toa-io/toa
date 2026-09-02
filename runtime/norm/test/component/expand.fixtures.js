const source = {
  path: import.meta.dirname, // `version` hashes the component directory
  entity: {
    schema: {
      type: 'object',
      properties: {
        foo: { type: 'string' }
      }
    },
    storage: 'mongodb'
  },
  bridge: 'node',
  operations: {
    add: {
      bridge: 'node',
      bindings: ['amqp'],
      input: {
        type: 'object',
        properties: {
          foo: { type: 'integer' },
          bar: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                baz: { type: 'string' }
              }
            }
          }
        }
      },
      output: {
        type: 'object',
        properties: {
          foo: { type: 'integer' },
          bar: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                baz: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  events: {
    happened: {
      bridge: 'node',
      binding: 'amqp'
    }
  },
  receivers: {
    one: 'transit',
    two: {
      binding: 'amqp',
      bridge: 'node',
      operation: 'transit'
    }
  }
}

const target = {
  entity: {
    schema: {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        }
      }
    },
    storage: '@toa.io/storages.mongodb'
  },
  bridge: '@toa.io/bridges.node',
  operations: {
    add: {
      bridge: '@toa.io/bridges.node',
      bindings: ['@toa.io/bindings.amqp'],
      input: {
        type: 'object',
        properties: {
          foo: {
            type: 'integer'
          },
          bar: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                baz: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      output: {
        type: 'object',
        properties: {
          foo: {
            type: 'integer'
          },
          bar: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                baz: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  events: {
    happened: {
      bridge: '@toa.io/bridges.node',
      binding: '@toa.io/bindings.amqp'
    }
  },
  receivers: {
    one: {
      operation: 'transit'
    },
    two: {
      bridge: '@toa.io/bridges.node',
      binding: '@toa.io/bindings.amqp',
      operation: 'transit'
    }
  }
}

export { source, target }
