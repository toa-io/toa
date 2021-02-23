'use strict'

const parser = require('@babel/parser')

const NAMES = ['transition', 'observation']
const STATES = ['object', 'collection']

function operation (file) {
  const algorithm = require(file)

  const ast = parser.parse(algorithm.toString())
  const { name, state } = node(ast.program.body[0])

  return { name, state, algorithm }
}

function node (node) {
  if (node.type !== 'FunctionDeclaration') { throw new Error('Algorithm must export named function declaration') }

  return { name: name(node), state: state(node) }
}

function name (node) {
  const name = node.id.name

  if (NAMES.indexOf(name) === -1) { throw new Error(`Algorithm name must be one of: ${NAMES.join(', ')}`) }

  return name
}

function state (node) {
  const param = node.params[1]?.name

  if (!param) return

  if (STATES.indexOf(param) === -1) { throw new Error(`Algorithm state (second) argument name must be one of: ${STATES.join(', ')}`) }

  return param
}

module.exports = files => files.map(operation)
