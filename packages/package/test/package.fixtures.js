'use strict'

const path = require('path')

const locator = { forename: 'simple' }

const state = {
  schema: {
    properties: {
      a: {
        type: 'string'
      }
    }
  }
}

const operations = [
  {
    algorithm: require('./dummy/operations/observe'),
    name: 'observe',
    type: 'observation',
    target: 'object'
  },
  {
    algorithm: require('./dummy/operations/transit'),
    name: 'transit',
    type: 'transition',
    target: 'collection'
  }
]

exports.path = path.resolve(__dirname, './dummy')
exports.locator = locator
exports.state = state
exports.operations = operations
