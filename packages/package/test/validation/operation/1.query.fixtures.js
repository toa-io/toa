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

const samples = {
  undefined: {
    query: undefined,
    ok: undefined
  },
  null: {
    query: null,
    ok: null
  },
  queryString: {
    query: 'foo',
    ok: {
      criteria: { foo: null }
    }
  },
  queryArray: {
    query: ['foo', 'bar', 'baz'],
    ok: {
      criteria: { foo: null, bar: null, baz: null }
    }
  },
  criteria: {
    undefined: {
      query: {},
      ok: {}
    },
    string: {
      query: {
        criteria: 'foo'
      },
      ok: {
        criteria: { foo: null }
      }
    },
    array: {
      query: {
        criteria: ['foo', 'bar', 'baz']
      },
      ok: {
        criteria: { foo: null, bar: null, baz: null }
      }
    }
  }
}

const sample = (id, target) => {
  const [type, sample] = id.split('.')
  const { query, ok } = sample ? samples[type][sample] : samples[type]
  const operation = { name: 'operate', target, query }

  return { operation, ok }
}

exports.manifest = manifest
exports.sample = sample
