'use strict'

const source = {
  entity: {
    schema: {
      properties: {
        foo: 'string'
      }
    },
    storage: '@toa.io/storages.mongodb'
  },
  bridge: '@toa.io/bridges.node',
  operations: {
    add: {
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
  receivers: {
    event: 'transit'
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
    storage: expect.stringMatching(/storages\.mongodb$/)
  },
  bridge: expect.stringMatching(/bridges\.node$/),
  operations: {
    add: {
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
  receivers: {
    event: {
      transition: 'transit'
    }
  }
}

exports.source = source
exports.target = target
