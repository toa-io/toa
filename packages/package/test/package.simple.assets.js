const path = require('path')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

const locator = { name: 'simple' }
const algorithms = {
  transit: {
    func: require(path.resolve(dummiesPath, './simple/operations/transit')),
    name: 'transit',
    type: 'transition',
    state: 'collection'
  },
  observe: {
    func: require(path.resolve(dummiesPath, './simple/operations/observe')),
    name: 'observe',
    type: 'observation',
    state: 'object'
  }
}

exports.locator = locator
exports.algorithms = algorithms
