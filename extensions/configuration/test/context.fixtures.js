'use strict'

const { generate } = require('randomstring')

const schema = {
  properties: {
    foo: {
      type: 'string',
      default: generate()
    },
    bar: {
      properties: {
        baz: {
          type: 'number',
          default: 1
        }
      }
    },
    quu: {
      type: 'number'
    }
  }
}

exports.schema = schema
