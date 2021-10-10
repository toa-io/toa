'use strict'

const { definition } = require('./operations/definition')
const load = require('../load')

const operations = async (root) => {
  const modules = await load.operations(root)

  return Object.fromEntries(modules.map(([name, module]) => [name, definition(module)]))
}

exports.operations = operations
