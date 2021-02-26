const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const locator = { forename: 'simple' }
const operations = {
  transit: {
    algorithm: require(path.resolve(root, './simple/operations/transit')),
    name: 'transit',
    type: 'transition',
    state: 'collection'
  },
  observe: {
    algorithm: require(path.resolve(root, './simple/operations/observe')),
    name: 'observe',
    type: 'observation',
    state: 'object'
  }
}

exports.path = path.resolve(root, 'simple')
exports.locator = locator
exports.operations = operations
