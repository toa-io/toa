'use strict'

const path = require('path')
const parser = require('@babel/parser')

const TYPES = ['transition', 'observation']
const STATES = ['object', 'collection']

function operation (file) {
  const algorithm = require(file)
  const name = path.parse(file).name

  const ast = parser.parse(algorithm.toString())
  const { type, state } = node(ast.program.body[0])

  return { name, type, state, algorithm }
}

function node (node) {
  if (node.type !== 'FunctionDeclaration') { throw new Error('Algorithm must export named function declaration') }

  return { type: type(node), state: state(node) }
}

function type (node) {
  const type = node.id.name

  if (TYPES.indexOf(type) === -1) { throw new Error(`Algorithm name must be one of: ${TYPES.join(', ')}, ${type} given`) }

  return type
}

function state (node) {
  const param = node.params[1]?.name

  if (!param) return

  if (STATES.indexOf(param) === -1) { throw new Error(`Algorithm state (second) argument name must be one of: ${STATES.join(', ')}`) }

  return param
}

const operations = files => files.map(operation)

exports.operations = operations
