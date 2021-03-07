'use strict'

const schemas = {
  entity: {
    $id: 'schemas://users/users/entity',
    properties: {
      foo: {
        type: 'string'
      },
      bar: {
        type: 'number'
      },
      baz: {
        type: 'number',
        default: 100
      }
    },
    required: ['foo']
  },
  input: {
    $id: 'schemas://users/users/add.input',
    properties: {
      foo: { $ref: 'entity#/properties/foo' }
    }
  }
}

const samples = {
  entity: {
    ok: {
      all: {
        foo: 'bar',
        bar: 12,
        baz: 23
      },
      required: {
        foo: 'bar'
      }
    },
    invalid: {
      type: {
        foo: 12
      },
      required: {
        bar: 12
      }
    }
  },
  input: {
    ok: {
      foo: 'bar'
    },
    invalid: {
      foo: 5
    }
  }
}

exports.schemas = schemas
exports.samples = samples
