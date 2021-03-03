'use strict'

const path = require('path')

const locator = { forename: 'simple' }
const operations = [
  {
    algorithm: require('./dummy/operations/observe'),
    name: 'observe',
    type: 'observation',
    state: 'object'
  },
  {
    algorithm: require('./dummy/operations/transit'),
    name: 'transit',
    type: 'transition',
    state: 'collection'
  }
]

exports.path = path.resolve(__dirname, './dummy')
exports.locator = locator
exports.operations = operations
