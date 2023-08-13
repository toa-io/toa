'use strict'

const { generate } = require('randomstring')

const schema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
      default: generate()
    },
    bar: {
      type: 'object',
      properties: {
        baz: {
          type: 'number',
          default: 1
        }
      }
    }
  }
}

const concise = {
  foo: schema.properties.foo.default,
  bar: {
    baz: schema.properties.bar.properties.baz.default
  }
}

exports.schema = schema
exports.concise = concise
