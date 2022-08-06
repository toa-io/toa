'use strict'

const load = require('../load')
const { define } = require('./.operations')

/** @type {toa.node.define.Operations} */
const operations = async (root) => {
  const modules = await load.operations(root)

  /** @type {toa.node.define.operations.List} */
  const operations = {}

  for (const [name, module] of modules) operations[name] = define(module)

  return operations
}

exports.operations = operations
