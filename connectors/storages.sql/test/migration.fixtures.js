'use strict'

/* eslint-disable */

const schema = {
  'properties': {
    'foo': {
      'type': 'integer', 'default': 0, 'definitions': {}
    }, 'bar': {
      'type': 'string', 'definitions': {}
    }, 'id': {
      'system': true,
      '$ref': 'https://schemas.toa.io/0.0.0/definitions#/definitions/id',
      'definitions': {}
    }, '_version': {
      'type': 'integer', 'default': 0, 'system': true, 'definitions': {}
    }
  }, 'required': ['id'], 'definitions': {}, 'type': 'object', 'additionalProperties': false
}

exports.schema = schema
