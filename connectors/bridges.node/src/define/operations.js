'use strict'

const load = require('../load')
const algorithm = require('./.operations')

/** @type {toa.node.define.Algorithms} */
const operations = async (root) => {
  const modules = await load.operations(root)

  /** @type {toa.node.define.algorithms.List} */
  const algorithms = {}

  for (const [name, module] of modules) {
    const definition = algorithm.define(module)

    if (definition !== null) algorithms[name] = definition
  }

  return algorithms
}

const extract = (module) => algorithm.extract(module)

exports.operations = operations
exports.extract = extract
