'use strict'

const source = {
  entity: {
    schema: {
      properties: {
        foo: 'string'
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
        properties: {
          foo: 'integer',
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: 'string'
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
      },
      output: {
        properties: {
          foo: 'integer',
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: 'string'
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
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
      transition: 'transit'
    }
  }
}

const target = {
  entity: {
    schema: {
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
        properties: {
          foo: {
            type: 'integer'
          },
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: {
                  type: 'string'
                }
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
      },
      output: {
        properties: {
          foo: {
            type: 'integer'
          },
          bar: {
            type: 'array',
            items: {
              properties: {
                baz: {
                  type: 'string'
                }
              }
            }
          },
          baz: {
            type: 'array',
            items: '~foo'
          }
        },
        id: null
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
      transition: 'transit'
    },
    two: {
      bridge: '@toa.io/bridges.node',
      binding: '@toa.io/bindings.amqp',
      transition: 'transit'
    }
  }
}

exports.source = source
exports.target = target
