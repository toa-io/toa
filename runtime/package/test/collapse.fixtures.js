'use strict'

const { generate } = require('randomstring')

const entity = {
  manifest: {
    entity: {
      schema: {
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          }
        },
        required: ['foo']
      }
    }
  },
  prototype: {
    entity: {
      schema: {
        properties: {
          foo: {
            default: 'ok'
          },
          baz: {
            type: 'boolean'
          }
        },
        required: ['baz']
      }
    }
  },
  result: {
    entity: {
      schema: {
        properties: {
          foo: {
            type: 'string',
            default: 'ok'
          },
          bar: {
            type: 'integer'
          },
          baz: {
            type: 'boolean'
          }
        },
        required: ['foo', 'baz']
      }
    }
  }
}

const operations = {
  manifest: {
    operations: [
      {
        name: 'add',
        bridge: 'b',
        query: false
      },
      {
        name: 'get',
        bridge: 'b'
      },
      {
        name: 'find',
        bridge: 'b'
      }
    ]
  },
  prototype: {
    prototype: null,
    remotes: ['remote1', 'remote2'],
    operations: [
      {
        name: 'add',
        bridge: 'a'
      },
      {
        name: 'find',
        bridge: 'a'
      },
      {
        name: 'observe',
        bridge: 'a',
        input: 'object'
      }
    ]
  },
  result: {
    prototype: {
      prototype: null,
      path: expect.any(String),
      remotes: ['remote1', 'remote2'],
      operations: [
        {
          name: 'add',
          bridge: 'a'
        },
        {
          name: 'find',
          bridge: 'a'
        },
        {
          name: 'observe',
          bridge: 'a'
        }
      ]
    },
    operations: [
      {
        name: 'add',
        bridge: 'b',
        query: false
      },
      {
        name: 'get',
        bridge: 'b'
      },
      {
        name: 'find',
        bridge: 'b'
      },
      {
        name: 'observe',
        input: 'object'
      }
    ]
  }
}

const find = jest.fn(() => generate())

exports.samples = { entity, operations }
exports.mock = { find }
