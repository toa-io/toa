'use strict'

const path = require('path')
const parser = require('@babel/parser')

const TYPES = ['transition', 'observation']
const STATES = ['object', 'collection']

function algorithm (file) {
  const func = require(file)
  const name = path.parse(file).name

  const ast = parser.parse(func.toString())
  const { type, state } = node(ast.program.body[0])

  return { name, type, state, func }
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

const algorithms = files => files.map(algorithm)

exports.algorithms = algorithms
