'use strict'

const path = require('path')

const { yaml } = require('../src/yaml')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

const loadExpectedManifest = async () => await yaml(path.resolve(__dirname, './expected.yaml'))

const loadExpectedOperations = async () => {
  const operations = []

  operations.push({
    algorithm: require(path.resolve(dummiesPath, './simple/operations/transit')),
    name: 'transit',
    type: 'transition',
    state: 'collection'
  })

  operations.push({
    algorithm: require(path.resolve(dummiesPath, './simple/operations/observe')),
    name: 'observe',
    type: 'observation',
    state: 'object'
  })

  return operations
}

exports.dummiesPath = dummiesPath
exports.loadExpectedManifest = loadExpectedManifest
exports.loadExpectedOperations = loadExpectedOperations
