const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const locator = { forename: 'simple' }
const algorithms = {
  transit: {
    func: require(path.resolve(root, './simple/operations/transit')),
    name: 'transit',
    type: 'transition',
    state: 'collection'
  },
  observe: {
    func: require(path.resolve(root, './simple/operations/observe')),
    name: 'observe',
    type: 'observation',
    state: 'object'
  }
}

exports.path = path.resolve(root, 'simple')
exports.locator = locator
exports.algorithms = algorithms
