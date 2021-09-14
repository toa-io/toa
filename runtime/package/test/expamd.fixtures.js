'use strict'

const source = {
  entity: {
    storage: 'mongodb',
    schema: {
      properties: {
        foo: 'string'
      }
    }
  },
  operations: [
    {
      input: {
        properties: {
          foo: 'integer'
        }
      },
      output: {
        properties: {
          foo: 'boolean'
        }
      }
    },
    {
      input: {
        properties: {
          foo: null
        }
      },
      output: {
        properties: {
          id: null,
          bar: '~foo'
        }
      }
    }
  ]
}

const target = {
  entity: {
    storage: {
      connector: 'mongodb'
    },
    schema: {
      properties: {
        foo: {
          type: 'string'
        }
      }
    }
  },
  operations: [
    {
      input: {
        properties: {
          foo: {
            type: 'integer'
          }
        }
      },
      output: {
        properties: {
          foo: {
            type: 'boolean'
          }
        }
      }
    },
    {
      input: {
        properties: {
          foo: {
            type: 'string'
          }
        }
      },
      output: {
        properties: {
          id: {
            type: 'string',
            pattern: '^[a-fA-F0-9]+$'
          },
          bar: {
            type: 'string'
          }
        }
      }
    }

  ]
}

exports.source = source
exports.target = target
