'use strict'

const clone = require('clone-deep')

const source = {
  entity: {
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
          foo: null,
          bar: '~foo',
          baz1: {
            type: 'array',
            items: '~foo'
          },
          baz2: {
            type: 'array',
            items: {
              properties: {
                foo: null,
                bar: '~foo'
              }
            }
          }
        }
      }
    }
  ]
}

const target = {
  entity: {
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
            type: 'string'
          },
          bar: {
            type: 'string'
          },
          baz1: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          baz2: {
            type: 'array',
            items: {
              properties: {
                foo: {
                  type: 'string'
                },
                bar: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  ]
}

source.operations[0].output = clone(source.operations[0].input)
target.operations[0].output = clone(target.operations[0].input)

exports.source = source
exports.target = target
