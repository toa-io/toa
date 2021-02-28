const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const locator = { forename: 'simple' }
const operations = [
  {
    algorithm: require(path.resolve(root, './simple/operations/observe')),
    name: 'observe',
    type: 'observation',
    state: 'object',
    http: [null]
  },
  {
    algorithm: require(path.resolve(root, './simple/operations/transit')),
    name: 'transit',
    type: 'transition',
    state: 'collection',
    http: [null]
  }
]

exports.path = path.resolve(root, 'simple')
exports.locator = locator
exports.operations = operations
