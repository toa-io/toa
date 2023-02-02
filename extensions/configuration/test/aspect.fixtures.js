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

const concise = {
  foo: schema.properties.foo.default,
  bar: {
    baz: schema.properties.bar.properties.baz.default
  }
}

exports.schema = schema
exports.concise = concise
