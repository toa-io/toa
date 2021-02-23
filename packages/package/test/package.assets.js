'use strict'

const path = require('path')

const yaml = require('../src/yaml')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

module.exports.dummiesPath = dummiesPath

module.exports.loadExpectedManifest = async () => await yaml(path.resolve(__dirname, './expected.yaml'))

module.exports.loadExpectedOperations = async () => {
  const operations = []

  operations.push({
    algorithm: require(path.resolve(dummiesPath, './simple/operations/transit')),
    name: 'transition',
    state: 'collection'
  })

  operations.push({
    algorithm: require(path.resolve(dummiesPath, './simple/operations/observe')),
    name: 'observation',
    state: 'object'
  })

  return operations
}
