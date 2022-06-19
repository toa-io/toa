'use strict'

const { generate } = require('randomstring')

const operations = {
  path: __dirname,
  bindings: ['foo', 'bar'],
  'bindings@local': ['foo'],
  operations: {
    add: {}
  },
  extensions: {
    '@toa.io/extensions.resources': {
      ['/' + generate()]: ['add']
    },
    './dummies/extension': {
      ok: true
    }
  }
}

exports.operations = operations
