'use strict'

const schemas = {
  parent: {
    $id: 'parent',
    definitions: {
      num: {
        type: 'number'
      }
    }
  },
  dependant: {
    $id: 'dependant',
    type: 'object',
    properties: {
      id: { $ref: 'parent#/definitions/num' },
      name: {
        type: 'string',
        default: 'default'
      }
    },
    required: ['id']
  }
}

const samples = {
  ok: {
    id: 1,
    name: 'ok'
  },
  invalid: {
    name: 'invalid'
  }
}

exports.schemas = schemas
exports.samples = samples
