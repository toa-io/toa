const path = require('path')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

const manifest = { name: 'simple' }
const algorithms = []

algorithms.push({
  func: require(path.resolve(dummiesPath, './simple/operations/transit')),
  name: 'transit',
  type: 'transition',
  state: 'collection'
})

algorithms.push({
  func: require(path.resolve(dummiesPath, './simple/operations/observe')),
  name: 'observe',
  type: 'observation',
  state: 'object'
})

exports.manifest = manifest
exports.algorithms = algorithms
