'use strict'

const parser = require('@babel/parser')

const parse = (algorithm) => {
  if (typeof algorithm !== 'function') throw new Error('Algorithm must export function')

  const ast = parser.parse(algorithm.toString())

  const { type, target } = node(ast.program.body[0])
  return { type, target }
}

function node (node) {
  if (node.type !== 'FunctionDeclaration') { throw new Error('Operation module must export named function declaration') }
  if (node.async !== true) { throw new Error('Operation module must export async function') }

  return { type: type(node), target: target(node) }
}

function type (node) {
  const type = node.id.name

  if (TYPES.indexOf(type) === -1) { throw new Error(`Unknown operation type '${type}'`) }

  return type
}

function target (node) {
  const param = node.params[1]?.name

  if (!param) return

  if (TARGETS.indexOf(param) === -1) { throw new Error(`Unknown target type '${param}'`) }

  return param
}

const TYPES = ['transition', 'observation']
const TARGETS = ['entry', 'set']

exports.parse = parse
