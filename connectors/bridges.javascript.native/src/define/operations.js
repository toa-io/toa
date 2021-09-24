'use strict'

const { parse } = require('./algorithm')
const load = require('../load')

const operation = async (root, name) => {
  const module = await load.event(root, name)
  return definition(module)
}

const operations = async (root) => {
  const modules = await load.operations(root)
  return Object.fromEntries(modules.map(([name, module]) => [name, definition(module)]))
}

const definition = (algorithm) => {
  return parse(algorithm)
}

exports.operation = operation
exports.operations = operations
