'use strict'

const manifest = {
  domain: 'validation',
  name: 'test',
  entity: {
    schema: {
      $id: 'entity',
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          format: 'email'
        },
        bar: {
          type: 'number',
          default: 10
        },
        baz: {
          type: 'boolean',
          minLength: 10
        }
      }
    }
  }
}

const criteria = (props) => {
  return {
    $id: 'http://validation/test/operate.query.criteria',
    type: 'object',
    properties: Object.fromEntries(props.map(({ name, extension }) => [name, { $ref: `entity#/properties/${name}`, ...extension }]))
  }
}

const samples = {
  query: {
    undefined: {
      operation: {
        query: undefined
      }
    },
    default: {
      operation: {
        query: {}
      },
      ok: {
        $id: 'http://validation/test/operate.query',
        type: 'object',
        properties: {
          criteria: {
            type: 'string'
          },
          omit: {
            type: 'integer',
            minimum: 0,
            maximum: 1000,
            default: 0
          },
          limit: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            default: 10
          }
        }
      }
    }
  },
  criteria: {
    undefined: {
      operation: {
        query: {}
      }
    },
    properties: {
      operation: {
        query: {
          criteria: {
            foo: null
          }
        }
      },
      ok: criteria([{ name: 'foo' }])
    },
    extension: {
      operation: {
        query: {
          criteria: {
            foo: null,
            bar: { maximum: 100 }
          }
        }
      },
      ok: criteria([
        { name: 'foo' },
        { name: 'bar', extension: { maximum: 100 } }
      ])
    }
  }
}

const sample = {
  query: (id) => {
    const { operation, ok } = samples.query[id]

    operation.name = 'operate'

    return { operation, ok }
  },
  criteria: (id) => {
    const { operation, ok } = samples.criteria[id]

    operation.name = 'operate'

    return { operation, ok }
  }
}

exports.manifest = manifest
exports.sample = sample
