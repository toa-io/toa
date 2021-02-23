'use strict'

const path = require('path')

const { yaml } = require('../src/yaml')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

const loadExpectedManifest = async () => await yaml(path.resolve(__dirname, './expected.yaml'))

const loadExpectedAlgorithms = async () => {
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

  return algorithms
}

exports.dummiesPath = dummiesPath
exports.loadExpectedManifest = loadExpectedManifest
exports.loadExpectedAlgorithms = loadExpectedAlgorithms
