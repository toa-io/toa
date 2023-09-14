'use strict'

const { generate } = require('randomstring')

const operations = {
  namespace: 'dummies',
  name: 'dummy',
  path: __dirname,
  bindings: ['foo', 'bar'],
  'bindings@local': ['foo'],
  operations: {
    add: {
      type: 'assignment'
    }
  },
  extensions: {
    '@toa.io/extensions.exposition': {
      ['/' + generate()]: {}
    },
    './dummies/extension': {
      ok: true
    }
  }
}

exports.operations = operations
