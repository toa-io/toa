'use strict'

const load = require('../load')
const algorithm = require('./.operations')

/** @type {toa.node.define.Algorithms} */
const operations = async (root) => {
  const modules = await load.operations(root)

  /** @type {toa.node.define.algorithms.List} */
  const algorithms = {}

  for (const [name, module] of modules) algorithms[name] = algorithm.define(module)

  return algorithms
}

const extract = (module) => algorithm.extract(module)

exports.operations = operations
exports.extract = extract
